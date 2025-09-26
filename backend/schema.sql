-- DROP SCHEMA public; 

CREATE SCHEMA public AUTHORIZATION postgres; 

-- DROP TYPE public."AssetType"; 

CREATE TYPE public."AssetType" AS ENUM ( 
	 'IMAGE', 
	 'VIDEO', 
	 'AUDIO', 
	 'THUMBNAIL'); 

-- DROP TYPE public."DistributionStatus"; 

CREATE TYPE public."DistributionStatus" AS ENUM ( 
	 'PENDING', 
	 'PROCESSING', 
	 'SUCCESS', 
	 'FAILED'); 

-- DROP TYPE public."JobStatus"; 

CREATE TYPE public."JobStatus" AS ENUM ( 
	 'PENDING', 
	 'PROCESSING_PREVIEW', 
	 'PREVIEW_READY', 
	 'HQ_PROCESSING', 
	 'COMPLETED', 
	 'FAILED', 
	 'DISTRIBUTED'); 

-- DROP TYPE public."Plan"; 

CREATE TYPE public."Plan" AS ENUM ( 
	 'FREE', 
	 'PRO', 
	 'ENTERPRISE'); 

-- DROP TYPE public."Role"; 

CREATE TYPE public."Role" AS ENUM ( 
	 'USER', 
	 'ADMIN', 
	 'DESIGNER'); 
-- public._prisma_migrations definition 

-- Drop table 

-- DROP TABLE public._prisma_migrations; 

CREATE TABLE public._prisma_migrations ( 
	 id varchar(36) NOT NULL, 
	 checksum varchar(64) NOT NULL, 
	 finished_at timestamptz NULL, 
	 migration_name varchar(255) NOT NULL, 
	 logs text NULL, 
	 rolled_back_at timestamptz NULL, 
	 started_at timestamptz DEFAULT now() NOT NULL, 
	 applied_steps_count int4 DEFAULT 0 NOT NULL, 
	 CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id) 
); 


-- public.admin_users definition 

-- Drop table 

-- DROP TABLE public.admin_users; 

CREATE TABLE public.admin_users ( 
	 id text NOT NULL, 
	 username text NOT NULL, 
	 email text NOT NULL, 
	 "passwordHash" text NOT NULL, 
	 "role" text DEFAULT 'admin'::text NOT NULL, 
	 "isActive" bool DEFAULT true NULL, 
	 "lastLoginAt" timestamp(3) NULL, 
	 "loginAttempts" int4 DEFAULT 0 NULL, 
	 "lockedUntil" timestamp(3) NULL, 
	 metadata jsonb NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NULL, 
	 "updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NULL, 
	 CONSTRAINT admin_users_email_key UNIQUE (email), 
	 CONSTRAINT admin_users_pkey PRIMARY KEY (id), 
	 CONSTRAINT admin_users_username_key UNIQUE (username) 
); 


-- public.api_providers definition 

-- Drop table 

-- DROP TABLE public.api_providers; 

CREATE TABLE public.api_providers ( 
	 id text NOT NULL, 
	 "name" text NOT NULL, 
	 slug text NOT NULL, 
	 description text NULL, 
	 category text NOT NULL, 
	 icon text NULL, 
	 color text NULL, 
	 "isActive" bool DEFAULT true NULL, 
	 "sortOrder" int4 DEFAULT 0 NULL, 
	 "configSchema" jsonb NULL, 
	 metadata jsonb NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NULL, 
	 "updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NULL, 
	 CONSTRAINT api_providers_pkey PRIMARY KEY (id), 
	 CONSTRAINT api_providers_slug_key UNIQUE (slug) 
); 


-- public.organizations definition 

-- Drop table 

-- DROP TABLE public.organizations; 

CREATE TABLE public.organizations ( 
	 id text NOT NULL, 
	 "name" text NOT NULL, 
	 "billingInfo" jsonb NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	 CONSTRAINT organizations_pkey PRIMARY KEY (id) 
); 


-- public.password_reset_codes definition 

-- Drop table 

-- DROP TABLE public.password_reset_codes; 

CREATE TABLE public.password_reset_codes ( 
	 id text NOT NULL, 
	 email text NOT NULL, 
	 code text NOT NULL, 
	 "expiresAt" timestamp(3) NOT NULL, 
	 used bool DEFAULT false NOT NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	 "updatedAt" timestamp(3) NOT NULL, 
	 CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id) 
); 
CREATE INDEX password_reset_codes_email_idx ON public.password_reset_codes USING btree (email); 
CREATE INDEX "password_reset_codes_expiresAt_idx" ON public.password_reset_codes USING btree ("expiresAt"); 


-- public.system_configs definition 

-- Drop table 

-- DROP TABLE public.system_configs; 

CREATE TABLE public.system_configs ( 
	 id text NOT NULL, 
	 "key" text NOT NULL, 
	 value jsonb NOT NULL, 
	 description text NULL, 
	 category text NULL, 
	 "isPublic" bool DEFAULT false NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NULL, 
	 "updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NULL, 
	 CONSTRAINT system_configs_key_key UNIQUE (key), 
	 CONSTRAINT system_configs_pkey PRIMARY KEY (id) 
); 


-- public.templates definition 

-- Drop table 

-- DROP TABLE public.templates; 

CREATE TABLE public.templates ( 
	 id text NOT NULL, 
	 "name" text NOT NULL, 
	 industry text NOT NULL, 
	 platform text NOT NULL, 
	 "promptImage" text NOT NULL, 
	 "promptText" text NOT NULL, 
	 "videoParams" jsonb NOT NULL, 
	 price numeric(65, 30) DEFAULT 0 NOT NULL, 
	 "isActive" bool DEFAULT true NOT NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	 CONSTRAINT templates_pkey PRIMARY KEY (id) 
); 


-- public.vendors definition 

-- Drop table 

-- DROP TABLE public.vendors; 

CREATE TABLE public.vendors ( 
	 id text NOT NULL, 
	 code text NOT NULL, 
	 "displayName" text NOT NULL, 
	 capabilities jsonb NOT NULL, 
	 "isActive" bool DEFAULT true NOT NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	 CONSTRAINT vendors_pkey PRIMARY KEY (id) 
); 
CREATE UNIQUE INDEX vendors_code_key ON public.vendors USING btree (code); 


-- public.verification definition 

-- Drop table 

-- DROP TABLE public.verification; 

CREATE TABLE public.verification ( 
	 id text NOT NULL, 
	 identifier text NOT NULL, 
	 value text NOT NULL, 
	 "expiresAt" timestamp(3) NOT NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL, 
	 "updatedAt" timestamp(3) NOT NULL, 
	 CONSTRAINT verification_pkey PRIMARY KEY (id) 
); 
CREATE UNIQUE INDEX verification_identifier_value_key ON public.verification USING btree (identifier, value); 

-- public.admin_audit_logs definition 

-- Drop table 

-- DROP TABLE public.admin_audit_logs; 

CREATE TABLE public.admin_audit_logs ( 
	 id text NOT NULL, 
	 "userId" text NULL, 
	 "action" text NOT NULL, 
	 resource text NOT NULL, 
	 "resourceId" text NULL, 
	 details jsonb NULL, 
	 "ipAddress" text NULL, 
	 "userAgent" text NULL, 
	 "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NULL, 
	 CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id) 
);

-- Add Better Auth required tables
CREATE TABLE IF NOT EXISTS public.user (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    emailVerified timestamp(3) NULL,
    image text NULL,
    createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT user_pkey PRIMARY KEY (id),
    CONSTRAINT user_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.session (
    id text NOT NULL,
    expiresAt timestamp(3) NOT NULL,
    token text NOT NULL,
    createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ipAddress text NULL,
    userAgent text NULL,
    userId text NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (id),
    CONSTRAINT session_token_key UNIQUE (token)
);

CREATE TABLE IF NOT EXISTS public.account (
    id text NOT NULL,
    accountId text NOT NULL,
    providerId text NOT NULL,
    userId text NOT NULL,
    accessToken text NULL,
    refreshToken text NULL,
    idToken text NULL,
    accessTokenExpiresAt timestamp(3) NULL,
    refreshTokenExpiresAt timestamp(3) NULL,
    scope text NULL,
    password text NULL,
    createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT account_pkey PRIMARY KEY (id)
);

-- Add foreign key constraints
ALTER TABLE public.session ADD CONSTRAINT session_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public.account ADD CONSTRAINT account_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id) ON DELETE CASCADE ON UPDATE CASCADE;