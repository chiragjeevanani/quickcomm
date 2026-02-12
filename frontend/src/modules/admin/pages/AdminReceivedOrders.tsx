import OrderListPage from "../components/OrderListPage";

export default function AdminReceivedOrders() {
  return (
    <OrderListPage
      title="Received Orders"
      description="New orders that have been received but not yet processed"
      defaultStatus="Received"
      fixedStatus={true}
    />
  );
}
