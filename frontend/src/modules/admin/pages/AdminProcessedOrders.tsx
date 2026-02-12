import OrderListPage from "../components/OrderListPage";

export default function AdminProcessedOrders() {
  return (
    <OrderListPage
      title="Processed Orders"
      description="Orders that have been processed and are ready for shipping"
      defaultStatus="Processed"
      fixedStatus={true}
    />
  );
}
