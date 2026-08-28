import { supabase } from '../config/supabase.js';

export async function getMenu(req, res) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, description, price, category, image_url, is_available')
      .order('name', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return res.status(500).json({ error: 'Failed to fetch menu items' });
  }
}
export async function addMenuItem(req, res) {
  try {
    const { name, description, price, category, image_url } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required fields' });
    }
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{ name, description, price, category, image_url }])
      .select();
    if (error) throw error;
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error adding menu item:', error);
    return res.status(500).json({ error: 'Failed to add menu item' });
  }
}