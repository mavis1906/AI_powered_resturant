insert into menu_items (name, description, price, category, is_available) values
('Classic Cheeseburger', 'Juicy beef patty with melted cheddar, lettuce, and tomato', 12.99, 'Mains', true),
('Crispy Chicken Wings', 'Spicy glazed wings served with ranch dip', 9.99, 'Appetizers', true),
('Pepperoni Pizza', 'Hand-tossed crust with loaded pepperoni and mozzarella', 15.49, 'Mains', true),
('Iced Vanilla Latte', 'Chilled espresso with milk and vanilla syrup', 4.99, 'Beverages', true),
('Chocolate Lava Cake', 'Warm molten chocolate cake with vanilla ice cream', 6.99, 'Desserts', true);-- Insert initial dummy orders


insert into orders (customer_name, total_amount, status, created_at) values
('Alice Johnson', 22.97, 'completed', now() - interval '2 hours'),
('Bob Smith', 15.49, 'pending', now() - interval '30 minutes');-- Insert corresponding order items


insert into order_items (order_id, menu_item_id, quantity, price_at_time)
select 
    (select id from orders where customer_name = 'Alice Johnson'),
    (select id from menu_items where name = 'Classic Cheeseburger'),
    1,
    12.99
union all
select 
    (select id from orders where customer_name = 'Alice Johnson'),
    (select id from menu_items where name = 'Iced Vanilla Latte'),
    2,
    4.99;-- Insert initial chat history logs
insert into chat_logs (user_message, ai_response, created_at) values
('What is on the menu?', 'We offer burgers, wings, pizza, beverages, and desserts! Would you like to place an order?', now() - interval '1 hour'),
('Can I get a cheeseburger?', 'I have added a Classic Cheeseburger to your cart.', now() - interval '45 minutes');