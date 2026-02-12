import OrderListPage from "../components/OrderListPage";

export default function AdminOutForDeliveryOrders() {
  return (
    <OrderListPage
      title="Out for Delivery"
      description="Orders currently out for final delivery"
      defaultStatus="Out for Delivery"
      fixedStatus={true}
    />
  );
}
