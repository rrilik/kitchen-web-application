import Swal from "sweetalert2";
import { removeFromWishlist } from "../store/wishlistSlice/wishlistSlice";
import getMessage from "./getMessage";

function handleRemoveFromWishlist(productNeedRemove, dispatch) {
  Swal.fire({
    text: "Хочете видалити цей продукт зі списку улюблених?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      dispatch(removeFromWishlist(productNeedRemove));
      getMessage("Товар видалено з вибраного!", "success");
    }
  });
}
export default handleRemoveFromWishlist;
