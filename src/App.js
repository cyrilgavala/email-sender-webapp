import './App.css';
import React, {useState} from "react";
import {Button, Form, Modal, Spinner} from "react-bootstrap";
import {GoogleLogin, GoogleLogout} from "react-google-login"
import Papa from "papaparse";
import Axios from 'axios'

const batchSize = parseInt(process.env.REACT_APP_BATCH_SIZE, 10)
const timeout = parseInt(process.env.REACT_APP_TIMEOUT, 10)
const client_id = process.env.REACT_APP_CLIENT_ID

export default function App() {

    const [headline, setHeadline] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [addresses, setAddresses] = useState([])
    const [isProcessing, setProcessing] = useState(false)
    const [user, setUser] = useState({})
    const [token, setToken] = useState({})

    const clearState = () => {
        setProcessing(false)
        setHeadline("")
        setSubject("")
        setMessage("")
        setAddresses([])
    }

    const handleSend = async () => {

        const sendMail = async (addressesString) => {

            const encodedMail = btoa("Content-Type: text/html; charset=\"UTF-8\"\nMIME-Version: 1.0\nContent-Transfer-Encoding: 7bit\n" +
                `Subject: ${subject}\nFrom: ${headline}\nBcc: ${addressesString}\n\n${message}`
            ).replace(/\+/g, '-').replace(/\//g, '_');
            await Axios.post(`https://www.googleapis.com/gmail/v1/users/me/messages/send?access_token=${token.access_token}`,
                {raw: encodedMail}).then((response) => {
                console.log(response.data)
            }).catch(err => {
                console.error(err)
                clearState()
                alert("Oops, something went wrong. Check out console output")
            })
        }

        setProcessing(true)
        const batches = []
        for (let i = 0, len = addresses.length; i < len; i += batchSize)
            batches.push(addresses.slice(i, i + batchSize));
        for (const value of batches) {
            const index = batches.indexOf(value);
            await sendMail(value.toString());
            if (index < batches.length - 1)
                await new Promise(r => setTimeout(r, timeout));
        }
        await clearState()
        alert(`Process ended ${new Date().toLocaleString()}.`)
    }

    const handleFileSubmit = (event) => {
        const fileFromEvent = event.target.files[0]
        Papa.parse(fileFromEvent, {
            complete: function (results) {
                setAddresses(results.data.map(item => item[0]))
            }
        })
    }

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
        clearState()
    }

    return (
        <div className="App">
            <Modal id={"spinner-modal"} show={isProcessing} backdrop="static" animation centered>
                <Spinner id={"spinner"} animation="border" role="status" variant={"light"}>
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Modal>
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
                <div className="row">
                    <Form.Control type="file" accept={".csv"} disabled={isProcessing}
                                  onChange={event => handleFileSubmit(event)}/>
                    <Button id="execute-btn" variant="outline-primary"
                            disabled={addresses.length === 0 || isProcessing}
                            onClick={handleSend}>
                        {isProcessing ? "Sending..." : "Send"}
                    </Button>
                </div>
                <div className="row">
                    <Form.Control id="headline" as="input" size="md" type="text" placeholder="Headline"
                                  disabled={isProcessing} value={headline}
                                  onChange={event => setHeadline(event.target.value)}/>
                </div>
                <div className="row">
                    <Form.Control id="subject" as="input" size="md" type="text" placeholder="Email subject"
                                  disabled={isProcessing} value={subject}
                                  onChange={event => setSubject(event.target.value)}/>
                </div>
                <div className="row">
                    <Form.Control id="message" as="textarea" size="md" type="text" placeholder="Email message"
                                  disabled={isProcessing} rows={10} value={message}
                                  onChange={event => setMessage(event.target.value)}/>
                </div>
            </div>
        </div>
    );
}