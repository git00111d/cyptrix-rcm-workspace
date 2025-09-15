-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('PROVIDER', 'EMPLOYEE', 'AUDITOR', 'ADMIN')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'ASSIGNED', 'CODING_IN_PROGRESS', 'CODING_COMPLETE', 'UNDER_AUDIT', 'APPROVED', 'REJECTED'))
);

-- Create document_codes table
CREATE TABLE IF NOT EXISTS document_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  icd10_codes TEXT[] DEFAULT '{}',
  cpt_codes TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  coded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for documents (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
  END IF;
END $$;

-- Row Level Security Policies

-- Profiles: Users can view their own profile, admins can view all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Documents: Providers can view their own, employees/auditors can view all
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own documents" ON documents;
CREATE POLICY "Providers can view own documents" ON documents
  FOR SELECT USING (
    provider_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('EMPLOYEE', 'AUDITOR', 'ADMIN')
    )
  );

DROP POLICY IF EXISTS "Providers can insert their own documents" ON documents;
CREATE POLICY "Providers can insert their own documents" ON documents
  FOR INSERT WITH CHECK (provider_id = auth.uid());

DROP POLICY IF EXISTS "Employees can update document status" ON documents;
CREATE POLICY "Employees can update document status" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('EMPLOYEE', 'AUDITOR', 'ADMIN')
    )
  );

-- Document codes: Employees can view and insert their own codes
ALTER TABLE document_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant document codes" ON document_codes;
CREATE POLICY "Users can view relevant document codes" ON document_codes
  FOR SELECT USING (
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = document_id AND d.provider_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('AUDITOR', 'ADMIN')
    )
  );

DROP POLICY IF EXISTS "Employees can insert document codes" ON document_codes;
CREATE POLICY "Employees can insert document codes" ON document_codes
  FOR INSERT WITH CHECK (
    employee_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('EMPLOYEE', 'AUDITOR')
    )
  );

-- Storage policies
DROP POLICY IF EXISTS "Providers can upload to their own folder" ON storage.objects;
CREATE POLICY "Providers can upload to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view documents they have access to" ON storage.objects;
CREATE POLICY "Users can view documents they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('EMPLOYEE', 'AUDITOR', 'ADMIN')
      )
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'PROVIDER');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update function for profiles
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();