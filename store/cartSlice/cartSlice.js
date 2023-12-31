import { createSlice } from "@reduxjs/toolkit";
import Swal from "sweetalert2";
const initialState = {
  cartItems: localStorage.getItem("cart_items")
    ? JSON.parse(localStorage.getItem("cart_items"))
    : [],
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      let newProduct = action.payload;
      let index = state.cartItems.findIndex(
        (product, index) => product._id === newProduct._id
      );
      if (index !== -1) {
        state.cartItems[index].quantity += newProduct.quantity;
      } else {
        state.cartItems.push(newProduct);
      }
      localStorage.setItem("cart_items", JSON.stringify(state.cartItems));
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (item, index) => item._id !== action.payload._id
      );
      localStorage.setItem("cart_items", JSON.stringify(state.cartItems));
    },
    removeAllProduct: (state, action) => {
      state.cartItems = [];
      localStorage.setItem("cart_items", JSON.stringify(state.cartItems));
    },
    setQuantityCart: (state, action) => {
      let { _id, type } = action.payload;
      let index = state.cartItems.findIndex((item) => item._id === _id);
      if (index !== -1) {
        if (type === "+") {
          state.cartItems[index].quantity += 1;
        } else if (type === "-") {
          if (state.cartItems[index].quantity > 1) {
            state.cartItems[index].quantity -= 1;
          } else {
            Swal.fire({
              text: "Мінімальна кількість має бути 1.",
              icon: "error",
            });
          }
        }
      }
    },
  },
});

export const { addToCart, removeFromCart, setQuantityCart, removeAllProduct } =
  cartSlice.actions;

export default cartSlice.reducer;
