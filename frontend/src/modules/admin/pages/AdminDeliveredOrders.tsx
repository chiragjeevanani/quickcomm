import OrderListPage from "../components/OrderListPage";

export default function AdminDeliveredOrders() {
  return (
    <OrderListPage
      title="Delivered Orders"
      description="View history of all completed deliveries"
      defaultStatus="Delivered"
      fixedStatus={true}
    />
  );
}
