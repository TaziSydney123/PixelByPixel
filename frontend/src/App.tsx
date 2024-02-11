import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import "./App.css";
import Login from "./pages/login/Login";
import CanvasPage from "./pages/canvas/CanvasPage";
import Home from "./pages/home/Home";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" >
                    <Route index element={<LoginPageWrapped />} />
                    <Route path="home" element={<Home />} />
                    <Route path="/canvas/:username" element={<CanvasPage />} />
                </Route>
                {/* {page == Page.LOGIN && (
                    <Login onSuccess={onLogin} />
                )}
                {page == Page.HOME && (
                    <>
                        <Home />
                    </>
                )}
                {userSelectOpen && (
                    <UserSelect onClose={() => setUserSelectOpen(false)} onSelected={() => {}}/>
                )} */}
            </Routes>
        </BrowserRouter>
    )
}

function LoginPageWrapped() {
    const navigate = useNavigate();

    const onLogin = () => {
        navigate("/home");
    };

    return <Login onSuccess={onLogin} />;
}

export default App
