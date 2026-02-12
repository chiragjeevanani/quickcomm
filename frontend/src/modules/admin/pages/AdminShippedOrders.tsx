import OrderListPage from "../components/OrderListPage";

export default function AdminShippedOrders() {
  return (
    <OrderListPage
      title="Shipped Orders"
      description="Track orders currently being shipped"
      defaultStatus="Shipped"
      fixedStatus={true}
    />
  );
}
