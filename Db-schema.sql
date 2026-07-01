-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE CHECK (phone ~ '^\+237\d{9}$'::text),
  mno_provider text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  email text UNIQUE,
  avatar_url text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  balance bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XAF'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.circles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  goal_type text,
  circle_type text NOT NULL CHECK (circle_type = ANY (ARRAY['solo'::text, 'pool'::text, 'rotation'::text])),
  target_amount bigint NOT NULL,
  contribution_amount bigint NOT NULL,
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])),
  invite_code text NOT NULL UNIQUE,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  visibility text NOT NULL DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text])),
  commitment_deposit_percentage integer DEFAULT 0,
  CONSTRAINT circles_pkey PRIMARY KEY (id),
  CONSTRAINT circles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.circle_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  circle_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'member'::text])),
  rotation_order integer,
  commitment_deposit bigint NOT NULL DEFAULT 0,
  deposit_status text NOT NULL DEFAULT 'pending'::text CHECK (deposit_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])),
  member_status text NOT NULL DEFAULT 'active'::text CHECK (member_status = ANY (ARRAY['active'::text, 'pending'::text, 'defaulted'::text, 'exited'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT circle_members_pkey PRIMARY KEY (id),
  CONSTRAINT circle_members_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.circles(id),
  CONSTRAINT circle_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.contributions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  circle_id uuid NOT NULL,
  member_id uuid NOT NULL,
  pawapay_deposit_id uuid,
  amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text, 'PENDING'::text, 'COMPLETED'::text, 'FAILED'::text])),
  cycle_number integer,
  due_at timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contributions_pkey PRIMARY KEY (id),
  CONSTRAINT contributions_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.circles(id),
  CONSTRAINT contributions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.circle_members(id)
);
CREATE TABLE public.disbursements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  circle_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  pawapay_payout_id uuid,
  amount bigint NOT NULL,
  round_number integer,
  trigger_type text NOT NULL CHECK (trigger_type = ANY (ARRAY['auto'::text, 'manual'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text])),
  disbursed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT disbursements_pkey PRIMARY KEY (id),
  CONSTRAINT disbursements_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.circles(id),
  CONSTRAINT disbursements_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id)
);
CREATE TABLE public.escrows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  pawapay_deposit_id uuid,
  pawapay_payout_id uuid,
  amount bigint NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'locked'::text CHECK (status = ANY (ARRAY['locked'::text, 'released'::text, 'refunded'::text, 'disputed'::text])),
  sender_confirm text NOT NULL DEFAULT 'pending'::text CHECK (sender_confirm = ANY (ARRAY['pending'::text, 'confirmed'::text])),
  recipient_confirm text NOT NULL DEFAULT 'pending'::text CHECK (recipient_confirm = ANY (ARRAY['pending'::text, 'confirmed'::text])),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT escrows_pkey PRIMARY KEY (id),
  CONSTRAINT escrows_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT escrows_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id)
);
CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contribution_id uuid,
  escrow_id uuid,
  pawapay_refund_id uuid,
  amount bigint NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT refunds_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.contributions(id),
  CONSTRAINT refunds_escrow_id_fkey FOREIGN KEY (escrow_id) REFERENCES public.escrows(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['top_up'::text, 'disbursement'::text, 'contribution'::text, 'escrow_deposit'::text, 'escrow_release'::text, 'refund'::text, 'transfer_in'::text, 'transfer_out'::text])),
  amount bigint NOT NULL,
  pawapay_ref text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text])),
  mno_provider text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  title text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);