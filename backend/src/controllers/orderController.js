import {supabase} from '../config/supabase.js'

export async function getOrders(req, res) {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_name, total_amount, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
    }

    const orderIds = orders.map((order) => order.id);

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('orders_id', orderIds);

    if (itemsError) throw itemsError;

    const menuItemIds = [...new Set(
      (items || [])
        .map((item) => item.menu_items_id)
        .filter(Boolean)
    )];

    let menuItems = [];

    if (menuItemIds.length > 0) {
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name')
        .in('id', menuItemIds);

      if (menuError) throw menuError;

      menuItems = menuData || [];
    }

    const ordersWithItems = orders.map((order) => ({
      ...order,
      order_items: (items || [])
        .filter((item) => item.orders_id === order.id)
        .map((item) => {
          const menuItem = menuItems.find(
            (menu) => menu.id === item.menu_items_id
          );

          return {
            ...item,
            name: menuItem?.name || 'Menu item'
          };
        })
    }));

    return res.status(200).json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);

    return res.status(500).json({
      error: error?.message || 'Failed to fetch orders',
      details: error?.details || null,
      hint: error?.hint || null,
      code: error?.code || null
    });
  }
}


export async function createOrder(req, res) {
  try {
    console.log('incoming req.body:', req.body);

    const { customer_name, total_amount, items } = req.body;

    if (!customer_name || !total_amount) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name,
          total_amount,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(items) && items.length > 0) {
  const resolvedItems = await Promise.all(
    items.map(async (item) => {
      if (item.menu_items_id) {
        const { data: menuItem, error: menuError } = await supabase
          .from('menu_items')
          .select('id, name, price, is_available')
          .eq('id', item.menu_items_id)
          .single();

        if (menuError || !menuItem) {
          throw new Error(`Menu item not found: ${item.menu_items_id}`);
        }

        return {
          menuItem,
          quantity: Number(item.quantity) || 1
        };
      }

      if (item.name) {
        const { data: menuItem, error: menuError } = await supabase
          .from('menu_items')
          .select('id, name, price, is_available')
          .ilike('name', item.name.trim())
          .limit(1)
          .maybeSingle();

        if (menuError || !menuItem) {
          throw new Error(`Menu item not found: ${item.name}`);
        }

        return {
          menuItem,
          quantity: Number(item.quantity) || 1
        };
      }

      throw new Error('Order item requires a menu item name');
    })
  );

  const unavailableItem = resolvedItems.find(
    (item) => item.menuItem.is_available === false
  );

  if (unavailableItem) {
    throw new Error(
      `Menu item is currently unavailable: ${unavailableItem.menuItem.name}`
    );
  }

  const orderItems = resolvedItems.map(({ menuItem, quantity }) => ({
  orders_id: data.id,
  menu_items_id: menuItem.id,
  quantity,
  price_at_time: menuItem.price
}));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    await supabase
      .from('orders')
      .delete()
      .eq('id', data.id);

    throw itemsError;
  }
}

    const { data: savedItems, error: savedItemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('orders_id', data.id);

    if (savedItemsError) throw savedItemsError;

    return res.status(201).json({
      ...data,
      order_items: savedItems || []
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
