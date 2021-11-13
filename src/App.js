import './App.css';
import React, {useState} from "react";
import {GoogleLogin, GoogleLogout} from "react-google-login"
import EmailForm from "./components/EmailForm";


const client_id = process.env.REACT_APP_CLIENT_ID

export default function App() {

    const [user, setUser] = useState({})
    const [token, setToken] = useState({})

    const onSuccess = (res) => {
        setUser(res.profileObj)
        setToken(res.tokenObj)
        let refreshTiming = (res.tokenObj.expires_in || 3300) * 1000
        const refreshToken = async () => {
            const newAuthRes = await res.reloadAuthResponse()
            refreshTiming = (newAuthRes.expires_in || 3300) * 1000
            setTimeout(refreshToken, refreshTiming)
        }
        setTimeout(refreshToken, refreshTiming)
    }

    const onFailure = (res) => {
        console.error(res)
    }

    const handleLogOut = () => {
        setUser({})
        setToken({})
        document.getElementById("email-form").reset();
    }

    return (
        <div className="App">
            <div id={"user-panel"}>
                {Object.keys(user).length === 0 &&
                <GoogleLogin id={"login-btn"} clientId={client_id} buttonText={"Log in"} isSignedIn={true}
                             cookiePolicy={"single_host_origin"} onSuccess={onSuccess} theme={"dark"}
                             onFailure={onFailure} scope={"profile email https://mail.google.com/"}/>}
                {Object.keys(user).length > 0 &&
                <GoogleLogout id={"logout-btn"} clientId={client_id} buttonText={`Logout ${user.name}`}
                              onLogoutSuccess={handleLogOut} theme={"dark"}/>}
            </div>
            <div id="main-container">
                <EmailForm token={token}/>
            </div>
        </div>
    );
}