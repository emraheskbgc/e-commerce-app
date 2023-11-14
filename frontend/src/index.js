import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LayoutComponent from "./pages/layout";
import HomeComponent from "./pages/home";
import ProductComponent from "./pages/product";
import OrderComponent from "./pages/order";
import BasketComponent from "./pages/basket";
import LoginComponent from "./pages/login";
import RegisterComponent from "./pages/register";

function AppComponent() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LayoutComponent />}>
            <Route index element={<HomeComponent />} />
            <Route path="products" element={<ProductComponent />} />
            <Route path="orders" element={<OrderComponent />} />
            <Route path="baskets" element={<BasketComponent />} />
          </Route>
          <Route path="login" element={<LoginComponent />} />
          <Route path="register" element={<RegisterComponent />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppComponent />);

reportWebVitals();
