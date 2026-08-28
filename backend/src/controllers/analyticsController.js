import { supabase } from '../config/supabase.js';
export async function getAnalytics(req, res) {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, status, created_at');
    if (error) throw error;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    return res.status(200).json({
      totalOrders,
      totalRevenue,
      pendingOrders
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}