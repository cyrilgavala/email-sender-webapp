import './App.css';
import React, {useState} from "react";
import {Button, Form, Modal, ProgressBar} from "react-bootstrap";
import Papa from "papaparse";
import Axios from 'axios'

const api_url = process.env.API_URL
const batchSize = process.env.BATCH_SIZE

function App() {

    const [showCredsModal, isCredsModalShown] = useState(true)
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [file, setFile] = useState(undefined)
    const [isProcessing, setProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [accepted, setAccepted] = useState(0)
    const [rejected, setRejected] = useState(0)

    function validate() {
        //TODO: in next iteration supply inputs validation
        return true;
    }

    async function handleSend() {

        async function sendMail(addressesString, progress) {
            await Axios.post(api_url, {
                username: username,
                password: password,
                bcc: addressesString,
                subject: subject,
                message: message
            }).then((response) => {
                if (response.status === 200) {
                    setAccepted(accepted + response.data.accepted)
                    setRejected(rejected + response.data.rejected)
                    setProgress(progress)
                } else {
                    setProcessing(false)
                    alert("Oops, something went wrong. Try again")
                }
            })

        }

        if (validate()) {
            setProcessing(true)

            await Papa.parse(file, {
                complete: async function (results) {
                    const addresses = results.data.map(item => item[0])
                    const batches = []
                    for (let i = 0, len = addresses.length; i < len; i += batchSize)
                        batches.push(addresses.slice(i, i + batchSize));
                    for (const value of batches) {
                        const index = batches.indexOf(value);
                        await sendMail(value.toString(), (index + 1) * (100 / batches.length));
                    }
                    console.log(`Process ended ${new Date().toLocaleString()}. Accepted: ${accepted}. Rejected: ${rejected}. Total ${addresses.length}`)
                    setProcessing(false)
                }
            })
        } else {
            alert("Invalid inputs")
        }
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
            <Modal show={showCredsModal} backdrop="static" animation>
                <Modal.Header>
                    <Modal.Title>Credentials</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" onChange={e => onUsernameChange(e)}/>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="Password" onChange={e => onPasswordChange(e)}/>
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
            <div id="main-container">
                <div className="row">
                    <ProgressBar variant="success" animated={"true"} now={progress} hidden={!isProcessing}/>
                </div>
                <div className="row">
                    <Form.Control type="file" disabled={isProcessing}
                                  onChange={event => setFile(event.target.files[0])}/>
                    <Button id="execute-btn" variant="outline-primary" disabled={isProcessing} onClick={handleSend}>
                        {isProcessing ? "Sending..." : "Send"}
                    </Button>
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
