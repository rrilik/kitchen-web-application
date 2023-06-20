import { addToCart } from "../store/cartSlice/cartSlice";
import getMessage from "./getMessage";

function handleAddToCart(product, quantity = 1, dispatch) {
  dispatch(
    addToCart({
      ...product,
      quantity: quantity,
    })
  );
  getMessage("Товар додано в кошик 😍", "success");
}
export default handleAddToCart;
