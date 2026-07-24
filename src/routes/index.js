import MainPage from "../pages/MainPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import BuilderPage from "../pages/BuilderPage.jsx";

export const publicRoutes = [
  { path: "/", component: MainPage },
  { path: "/login", component: LoginPage },
];

export const protectedRoutes = [
  { path: "/builder", component: BuilderPage },
];
