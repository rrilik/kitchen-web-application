import React, { useEffect } from "react";
import BreadCrumb from "../../components/BreadCrumb/BreadCrumb";
import styled from "styled-components";
import Field from "../../components/field/Field";
import Input from "../../components/input/Input";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ButtonSubmit from "../../components/ButtonSubmit/ButtonSubmit";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { register } from "../../store/auth/userSlice";
import getMessage from "../../utils/getMessage";

const schemaValidate = yup.object({
  fullName: yup.string().required("Введіть своє ім'я та прізвище"),
  email: yup
    .string()
    .email("Введіть дійсну адресу електронної пошти!")
    .required("Будь ласка, введіть адресу електронної пошти"),
  password: yup
    .string()
    .min(8, "Будь ласка, введіть пароль не менше 8 символів!")
    .required("Будь ласка, введіть пароль!"),
  passwordConfirm: yup
    .string()
    .required("Будь ласка, підтвердьте пароль!")
    .oneOf([yup.ref("password")], "Пароль підтвердження неправильний!"),
});
const SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(schemaValidate),
  });
  const handleSignUp = async (values) => {
    if (!isValid) return;

    try {
      const action = register(values);
      const resultAction = await dispatch(action);
      const data = unwrapResult(resultAction);
      if (data.status === "fail") {
        getMessage(data.message, "error");
      } else {
        getMessage("Обліковий запис успішно створено", "success");
        navigate("/");
      }
    } catch (err) {
      console.log(err);
    }
  };
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
    document.title = "зареєструватися";
  }, []);
  useEffect(() => {
    currentUser?.user && navigate("/");
  }, []);
  return (
    <StyledSignUp className="sign-up-page">
      <BreadCrumb heading="Sign up Page" />
      <div className="wrapper-layout section">
        <div className="flex justify-center items-center">
          <div className="px-4 py-6 flex flex-col w-[450px] sign-up-form  rounded-md bg-white">
            <h3 className="text-secondary text-4xl font-semibold text-center">
              зареєструватися
            </h3>
            <form
              onSubmit={handleSubmit(handleSignUp)}
              className="flex flex-col mt-4"
            >
              <Field>
                <Input
                  type="text"
                  name="fullName"
                  placeholder="Ім'я та прізвище"
                  control={control}
                />
              </Field>
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
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  control={control}
                />
              </Field>
              <Field>
                <Input
                  type="password"
                  name="passwordConfirm"
                  placeholder="Підтвердити пароль"
                  control={control}
                />
              </Field>
              <ButtonSubmit
                isLoading={isSubmitting}
                disabled={isSubmitting}
                height="50px"
                type="submit"
              >
                зареєструватися
              </ButtonSubmit>
              <div className="mt-3 flex items-center gap-x-3">
                <span className="text-textPrimary font-light">
                Ви вже маєте акаунт?
                </span>
                <NavLink
                  to={"/sign-in"}
                  className="italic text-blue-500 text-sm cursor-pointer underline font-light"
                >
                  авторизуватися
                </NavLink>
              </div>
            </form>
          </div>
        </div>
      </div>
    </StyledSignUp>
  );
};

export default SignUp;
const StyledSignUp = styled.div`
  .sign-up-form {
    -webkit-box-shadow: 0 5px 30px rgb(0 0 0 / 10%);
    box-shadow: 0 5px 30px rgb(0 0 0 / 10%);
  }
`;
