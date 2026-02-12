import OrderListPage from "../components/OrderListPage";

export default function AdminCancelledOrders() {
  return (
    <OrderListPage
      title="Cancelled Orders"
      description="View orders that have been cancelled"
      defaultStatus="Cancelled"
      fixedStatus={true}
    />
  );
}
