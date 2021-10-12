import './App.css';
import React, {useState} from "react";
import {Button, Form, Modal, Spinner} from "react-bootstrap";
import Papa from "papaparse";
import Axios from 'axios'

const api_url = process.env.API_URL || "https://emailsender-api.herokuapp.com/mail"
const batchSize = parseInt(process.env.BATCH_SIZE, 10) || 100
const timeout = parseInt(process.env.TIMEOUT, 10) || 1800000

function App() {

    const [showCredsModal, isCredsModalShown] = useState(true)
    const [headline, setHeadline] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [addresses, setAddresses] = useState([])
    const [isProcessing, setProcessing] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    function clearState() {
        setProcessing(false)
        setHeadline("")
        setSubject("")
        setMessage("")
    }

    async function handleSend() {

        async function sendMail(addressesString) {
            return await Axios.post(api_url, {
                username: username,
                password: password,
                bcc: addressesString,
                headline: headline,
                subject: subject,
                message: message,
            }).then((response) => {
                let accepted = response.data.accepted
                let rejected = response.data.rejected
                return {accepted: accepted, rejected: rejected}
            }).catch(err => {
                console.error(err)
                clearState()
                alert("Oops, something went wrong. Check out console output")
            })
        }

        setProcessing(true)
        let accepted = 0
        let rejected = 0
        const batches = []
        for (let i = 0, len = addresses.length; i < len; i += batchSize)
            batches.push(addresses.slice(i, i + batchSize));
        for (const value of batches) {
            const index = batches.indexOf(value);
            const result = await sendMail(value.toString());
            if (result !== undefined) {
                accepted += result.accepted
                rejected += result.rejected
            }
            if (index < batches.length - 1)
                await new Promise(r => setTimeout(r, timeout));
        }
        await clearState()
        alert(`Process ended ${new Date().toLocaleString()}.\nAccepted: ${accepted}. Rejected: ${rejected}. Total ${addresses.length}`)
    }

    function handleFileSubmit(event) {
        const file = event.target.files[0]
        Papa.parse(file, {
            complete: function (results) {
                setAddresses(results.data.map(item => item[0]))
            }
        })
    }

    function onUsernameChange(event) {
        event.preventDefault()
        setUsername(event.target.value)
    }

    function onPasswordChange(event) {
        event.preventDefault()
        setPassword(event.target.value)
    }

    return (
        <div className="App">
            <Modal id={"creds-modal"} show={showCredsModal} backdrop="static" animation>
                <Modal.Header>
                    <Modal.Title>Credentials</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control type="email" value={username} placeholder="Enter email"
                                      onChange={e => onUsernameChange(e)}/>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" value={password} placeholder="Password"
                                      onChange={e => onPasswordChange(e)}/>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-primary" onClick={e => {
                        e.preventDefault();
                        isCredsModalShown(false)
                    }}>
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal id={"spinner-modal"} show={isProcessing} backdrop="static" animation centered>
                <Spinner id={"spinner"} animation="border" role="status" variant={"light"}>
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Modal>
            <div id="main-container">
                <div className="row">
                    <Form.Control type="file" disabled={isProcessing}
                                  onChange={event => handleFileSubmit(event)}/>
                    <Button id="execute-btn" variant="outline-primary" disabled={addresses.length === 0 || isProcessing}
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

export default App;
