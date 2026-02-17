-- Invoicia Database Schema for Supabase
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  default_terms TEXT DEFAULT 'Net 30',
  total_invoiced DECIMAL(12, 2) DEFAULT 0,
  outstanding DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(12, 2) NOT NULL,
  unit TEXT NOT NULL, -- hour, item, day, etc.
  tax_category TEXT DEFAULT 'Services',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  number TEXT NOT NULL,
  po_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, viewed, overdue, paid, void
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, number)
);

-- =====================================================
-- INVOICE LINE ITEMS TABLE
-- =====================================================
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount DECIMAL(12, 2) NOT NULL,
  method TEXT NOT NULL, -- card, ach, wire, check, etc.
  status TEXT NOT NULL DEFAULT 'pending', -- pending, successful, failed
  transaction_id TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT EVENTS TABLE
-- =====================================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL, -- invoice.created, invoice.sent, payment.received, etc.
  entity TEXT NOT NULL, -- invoice, customer, product, etc.
  entity_id TEXT NOT NULL,
  details TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REMINDER RULES TABLE
-- =====================================================
CREATE TABLE reminder_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  timing TEXT NOT NULL,
  day_offset INTEGER NOT NULL, -- negative for before, positive for after due date
  tone TEXT NOT NULL, -- friendly, firm, final
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REMINDER LOGS TABLE
-- =====================================================
CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_rule_id UUID REFERENCES reminder_rules(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- sent, delivered, opened, failed
  date TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ATTACHMENTS TABLE (for invoice attachments)
-- =====================================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- path in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION SETTINGS TABLE
-- =====================================================
CREATE TABLE organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#6366f1',
  invoice_template TEXT DEFAULT 'classic',
  peppol_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_products_organization ON products(organization_id);
CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_payments_organization ON payments(organization_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_audit_events_organization ON audit_events(organization_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_reminder_logs_organization ON reminder_logs(organization_id);
CREATE INDEX idx_reminder_logs_invoice ON reminder_logs(invoice_id);
CREATE INDEX idx_attachments_organization ON attachments(organization_id);
CREATE INDEX idx_attachments_invoice ON attachments(invoice_id);

-- =====================================================
-- TRIGGERS for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_rules_updated_at BEFORE UPDATE ON reminder_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for the user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company', 'My Organization'))
  RETURNING id INTO new_org_id;

  -- Create the user profile
  INSERT INTO public.profiles (id, organization_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    'owner'
  );

  -- Create default organization settings
  INSERT INTO public.organization_settings (organization_id)
  VALUES (new_org_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = public.user_organization_id());

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (id = public.user_organization_id());

-- Profiles: Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Customers: Users can manage customers in their organization
CREATE POLICY "Users can view customers in their organization"
  ON customers FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert customers in their organization"
  ON customers FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update customers in their organization"
  ON customers FOR UPDATE
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can delete customers in their organization"
  ON customers FOR DELETE
  USING (organization_id = public.user_organization_id());

-- Products: Users can manage products in their organization
CREATE POLICY "Users can view products in their organization"
  ON products FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert products in their organization"
  ON products FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update products in their organization"
  ON products FOR UPDATE
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can delete products in their organization"
  ON products FOR DELETE
  USING (organization_id = public.user_organization_id());

-- Invoices: Users can manage invoices in their organization
CREATE POLICY "Users can view invoices in their organization"
  ON invoices FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert invoices in their organization"
  ON invoices FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update invoices in their organization"
  ON invoices FOR UPDATE
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can delete invoices in their organization"
  ON invoices FOR DELETE
  USING (organization_id = public.user_organization_id());

-- Invoice Line Items: Accessible through invoice
CREATE POLICY "Users can view line items for their invoices"
  ON invoice_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_line_items.invoice_id
    AND invoices.organization_id = public.user_organization_id()
  ));

CREATE POLICY "Users can insert line items for their invoices"
  ON invoice_line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_line_items.invoice_id
    AND invoices.organization_id = public.user_organization_id()
  ));

CREATE POLICY "Users can update line items for their invoices"
  ON invoice_line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_line_items.invoice_id
    AND invoices.organization_id = public.user_organization_id()
  ));

CREATE POLICY "Users can delete line items for their invoices"
  ON invoice_line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_line_items.invoice_id
    AND invoices.organization_id = public.user_organization_id()
  ));

-- Payments: Users can view payments in their organization
CREATE POLICY "Users can view payments in their organization"
  ON payments FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert payments in their organization"
  ON payments FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

-- Audit Events: Users can view audit events in their organization
CREATE POLICY "Users can view audit events in their organization"
  ON audit_events FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert audit events in their organization"
  ON audit_events FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

-- Reminder Rules: Users can manage reminder rules in their organization
CREATE POLICY "Users can view reminder rules in their organization"
  ON reminder_rules FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert reminder rules in their organization"
  ON reminder_rules FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update reminder rules in their organization"
  ON reminder_rules FOR UPDATE
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can delete reminder rules in their organization"
  ON reminder_rules FOR DELETE
  USING (organization_id = public.user_organization_id());

-- Reminder Logs: Users can view reminder logs in their organization
CREATE POLICY "Users can view reminder logs in their organization"
  ON reminder_logs FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert reminder logs in their organization"
  ON reminder_logs FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

-- Attachments: Users can manage attachments in their organization
CREATE POLICY "Users can view attachments in their organization"
  ON attachments FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can insert attachments in their organization"
  ON attachments FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can delete attachments in their organization"
  ON attachments FOR DELETE
  USING (organization_id = public.user_organization_id());

-- Organization Settings: Users can view and update their organization settings
CREATE POLICY "Users can view their organization settings"
  ON organization_settings FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can update their organization settings"
  ON organization_settings FOR UPDATE
  USING (organization_id = public.user_organization_id());
