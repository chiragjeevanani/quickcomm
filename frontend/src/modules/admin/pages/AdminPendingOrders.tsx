import OrderListPage from "../components/OrderListPage";

export default function AdminPendingOrders() {
  return (
    <OrderListPage
      title="Pending Orders"
      description="View and manage orders waiting for processing"
      defaultStatus="Pending"
      fixedStatus={true}
    />
  );
}
