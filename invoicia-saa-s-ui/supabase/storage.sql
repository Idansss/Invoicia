-- Supabase Storage Buckets Setup
-- Run this in your Supabase SQL Editor after creating the schema

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create buckets (you can also do this in the Supabase Dashboard > Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('logos', 'logos', false),
  ('attachments', 'attachments', false),
  ('invoice-pdfs', 'invoice-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Logos Bucket Policies
-- Users can upload logos for their organization
CREATE POLICY "Users can upload logos for their organization"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' 
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Users can view logos for their organization
CREATE POLICY "Users can view logos for their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Users can update logos for their organization
CREATE POLICY "Users can update logos for their organization"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Users can delete logos for their organization
CREATE POLICY "Users can delete logos for their organization"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Attachments Bucket Policies
-- Users can upload attachments for their organization
CREATE POLICY "Users can upload attachments for their organization"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Users can view attachments for their organization
CREATE POLICY "Users can view attachments for their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Users can delete attachments for their organization
CREATE POLICY "Users can delete attachments for their organization"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Invoice PDFs Bucket Policies
-- Users can upload PDFs for their organization
CREATE POLICY "Users can upload PDFs for their organization"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Users can view PDFs for their organization
CREATE POLICY "Users can view PDFs for their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- Users can delete PDFs for their organization
CREATE POLICY "Users can delete PDFs for their organization"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-pdfs'
  AND (storage.foldername(name))[1] = public.user_organization_id()::text
);

-- =====================================================
-- NOTES ON STORAGE STRUCTURE
-- =====================================================
-- Files should be organized by organization_id:
-- logos/{organization_id}/logo.png
-- attachments/{organization_id}/{invoice_id}/{filename}
-- invoice-pdfs/{organization_id}/{invoice_id}.pdf
