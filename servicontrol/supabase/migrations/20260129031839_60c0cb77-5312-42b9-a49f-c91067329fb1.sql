-- Create enum for service status
CREATE TYPE public.service_status AS ENUM ('pending', 'in_progress', 'completed', 'paid', 'overdue');

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  client TEXT NOT NULL,
  description TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL DEFAULT 0,
  status service_status NOT NULL DEFAULT 'pending',
  expected_date DATE NOT NULL,
  days_worked INTEGER NOT NULL DEFAULT 0,
  daily_rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipts table
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  expected_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  received_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  difference DECIMAL(12,2) GENERATED ALWAYS AS (received_value - expected_value) STORED,
  notes TEXT,
  working_capital DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Users can view their own services"
  ON public.services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON public.services FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for receipts
CREATE POLICY "Users can view their own receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
  ON public.receipts FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_services_user_id ON public.services(user_id);
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX idx_receipts_service_id ON public.receipts(service_id);