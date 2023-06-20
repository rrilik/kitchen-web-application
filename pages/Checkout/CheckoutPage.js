import React, { useEffect, useState } from "react";
import BreadCrumb from "../../components/BreadCrumb/BreadCrumb";
import { NavLink, useNavigate } from "react-router-dom";
import Field from "../../components/field/Field";
import Input from "../../components/input/Input";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch, useSelector } from "react-redux";
import { removeAllProduct } from "../../store/cartSlice/cartSlice";
import axios from "axios";
import styled from "styled-components";
import { MenuItem, Select } from "@mui/material";
import { cartItemsTotalSelector } from "../../store/cartSlice/Selector";
import ButtonSubmit from "../../components/ButtonSubmit/ButtonSubmit";
import { provineApi } from "../../service/provineApi";
import orderApi from "../../service/orderApi";
import getMessage from "../../utils/getMessage";
const schema = yup.object({
  fullName: yup.string().required("Будь ласка, введіть своє ім'я!"),
  email: yup
    .string()
    .email("Будь ласка, введіть дійсну адресу електронної пошти!")
    .required("Будь ласка, введіть адресу електронної пошти!"),
  phoneNumber: yup
    .string()
    .matches(/^\d{10,11}$/, "Будь ласка введіть дійсний номер телефону!"),
  address: yup.string().required("Будь ласка, введіть номер будинку та назву вулиці!"),
  cityAddress: yup.string().required("Будь ласка, виберіть місто!"),
  districtAddress: yup.string().required("Будь ласка, виберіть район!"),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const { cartItems } = useSelector((state) => state.cart);
  const { currentUser } = useSelector((state) => state.user);
  const cartItemsTotal = useSelector(cartItemsTotalSelector);
  const priceShipping = 150000;
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
  });
  const handleChooseCity = (e, item) => {
    setDistricts(item.districts);
  };

  const handleCheckout = async (values) => {
    if (!isValid) {
      return;
    }
    let productOrders = cartItems?.map((item) => {
      return {
        product: item._id,
        amount: item.quantity,
      };
    });
    let order = {
      fullName: values.fullName,
      phoneNumber: values.phoneNumber,
      address: `${
        values.address +
        ", " +
        values.cityAddress +
        ", " +
        values.districtAddress
      }`,
      products: [...productOrders],
    };
    try {
      const res = await orderApi.createOrder(order);

      if (res.status !== "success") {
        getMessage(res.errors.amount, "error");
      } else {
        getMessage("Замовлення успішне ", "success");
        dispatch(removeAllProduct([]));
        if (currentUser?.user) {
          navigate(`/checkout-success`);
        } else {
          navigate(`/checkout-success/${res?.order?._id}`);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    async function fetchProvinces() {
      try {
        const response = await axios.get(provineApi.getAllProvine());
        if (response.data) {
          setProvinces(response.data);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchProvinces();
  }, []);

  useEffect(() => {
    const arrErroes = Object.values(errors);
    if (arrErroes.length > 0) {
      toast.error(arrErroes[0]?.message, {
        pauseOnHover: false,
        delay: 0,
      });
    }
  }, [errors]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (!cartItems.length) {
      navigate("/products");
      getMessage("Кошик порожній", "error");
    }
  }, []);
  return (
    <StyledCheckout className="checkout-page">
      <BreadCrumb heading="Checkout" title="Home - Checkout" />
      <div className="wrapper-layout section">
        <form
          onSubmit={handleSubmit(handleCheckout)}
          autoComplete="off"
          className="grid grid-cols-2 gap-x-5"
        >
          <div className="flex flex-col">
            <div className="flex justify-between mb-4">
              <span className="text-xl font-medium text-secondary">
                Деталі відправлення
              </span>
              {!currentUser?.user && (
                <div className="flex items-center gap-x-2">
                  <span className="text-base font-light text-gray-400">
                  Ви вже маєте акаунт?
                  </span>
                  <NavLink
                    to="/sign-in"
                    className="text-lg font-light cursor-pointer text-bgPrimary"
                  >
                    авторизуватися
                  </NavLink>
                </div>
              )}
            </div>
            <Field>
              <Input
                type="text"
                name="fullName"
                placeholder="Ім'я та прізвище"
                control={control}
              />
            </Field>
            <div className="grid grid-cols-2 gap-x-3">
              <Field>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  control={control}
                />
              </Field>
              <Field>
                <Input
                  type="number"
                  name="phoneNumber"
                  placeholder="Номер телефону"
                  control={control}
                />
              </Field>
            </div>
            <Field>
              <Input
                type="text"
                name="address"
                placeholder="Номер будинку, назва вулиці"
                control={control}
              />
            </Field>
            <div className="grid grid-cols-2 gap-x-3">
              <div className="relative">
                <span className="absolute left-0 text-xs font-light -top-4 text-textPrimary">
                Виберіть провінцію/місто
                </span>
                <Select
                  {...register("cityAddress")}
                  defaultValue=""
                  className="w-full"
                >
                  {provinces.map((item, index) => {
                    return (
                      <MenuItem
                        onClick={(e) => handleChooseCity(e, item)}
                        key={item.code}
                        value={item.name}
                      >
                        {item.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </div>
              <div className="relative">
                <span className="absolute left-0 text-xs font-light -top-4 text-textPrimary">
                Виберіть район/район
                </span>
                <Select
                  {...register("districtAddress")}
                  defaultValue=""
                  className="w-full"
                >
                  {districts &&
                    districts.map((item, index) => {
                      return (
                        <MenuItem key={item.code} value={item.name}>
                          {item.name}
                        </MenuItem>
                      );
                    })}
                </Select>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <span className="text-lg text-secondary">
              Метод доставки
              </span>
              <div className="flex items-center p-4 border border-gray-400 rounded-md gap-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                  <i className="text-4xl text-white bi leading-[0] bi-dot"></i>
                </div>
                <div className="flex items-center gap-x-4">
                  <img
                    src="https://hstatic.net/0/0/global/design/seller/image/payment/cod.svg?v=4"
                    alt=""
                  />
                  <span>Оплата при отриманні (COD)</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <ButtonSubmit
                isLoading={isSubmitting}
                disabled={isSubmitting}
                height="50px"
                type="submit"
              >
                Виконайте замовлення
              </ButtonSubmit>
            </div>
          </div>
          <div className="order-information flex flex-col gap-y-4 border border-b-0 border-gray-300 p-3 bg-[#fafafa]">
            <div className="order-list py-3 pr-3  flex flex-col gap-y-4 h-[350px] has-scrollbar">
              {cartItems &&
                cartItems.length > 0 &&
                cartItems.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center px-2 py-2 bg-white border-b border-gray-300 rounded-md"
                  >
                    <div className="relative">
                      <div className="relative overflow-hidden bg-white border border-gray-300 rounded-md w-14 h-14">
                        {order && order.images ? (
                          <img
                            className="object-cover w-full rounded-md"
                            src={order.images[0]}
                            alt=""
                          />
                        ) : (
                          <></>
                        )}
                      </div>
                      <span className="absolute -top-[10px] -right-2 w-5 h-5 flex justify-center items-center text-sm font-light leading-[0] text-white bg-gray-600 rounded-full ">
                        {order.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full pl-4">
                      <div className="relative ">
                        <span className="text-base font-light text-textPrimary">
                          {order.name}
                        </span>
                        <p className="text-xs font-light text-textColor">
                          COLOR: Blue
                        </p>
                      </div>
                      <span className="text-sm font-light text-textPrimary">
                        {(order.price * order.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="py-5 border-t border-b border-gray-300 place-order">
              <div className="flex justify-between mb-3">
                <span className="text-sm font-light text-secondary">
                Тимчасовий
                </span>
                <p className="text-sm font-light text-textPrimary">
                  {cartItemsTotal.toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-light text-secondary">
                Транспортна плата
                </span>
                <p className="text-sm font-light text-textPrimary">
                  {priceShipping.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xl font-light text-secondary">
              всього
              </span>
              <div className="flex items-center gap-x-3">
                <span className="text-sm font-light text-gray-400">VND</span>
                <span className="text-xl font-medium text-secondary">
                  {(cartItemsTotal + priceShipping).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </StyledCheckout>
  );
};

export default CheckoutPage;
const StyledCheckout = styled.div`
  & .MuiSelect-select {
    padding-top: 10px;
    padding-bottom: 10px;
  }
`;
