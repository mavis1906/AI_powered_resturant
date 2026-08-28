create extension if not exists "uuid-ossp";-- 1. Menu Table

create table if not exists menu_items (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    price decimal(10, 2) not null,
    category text not null,
    is_available boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Orders Table
create table if not exists orders (
    id uuid default uuid_generate_v4() primary key,
    customer_name text not null,
    total_amount decimal(10, 2) not null,
    status text default 'pending' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Order Items Table (Links orders to menu items)
create table if not exists order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references orders(id) on delete cascade not null,
    menu_item_id uuid references menu_items(id) on delete set null,
    quantity integer not null default 1,
    price_at_time decimal(10, 2) not null
);

-- 4. Chat Logs Table
create table if not exists chat_logs (
    id uuid default uuid_generate_v4() primary key,
    user_message text not null,
    ai_response text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);