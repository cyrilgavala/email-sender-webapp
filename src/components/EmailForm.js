import React, {useState} from "react";
import Axios from "axios";
import Papa from "papaparse";
import {Modal, Spinner} from "react-bootstrap";

export default function EmailForm(props) {

    const batchSize = parseInt(process.env.REACT_APP_BATCH_SIZE, 10)
    const timeout = parseInt(process.env.REACT_APP_TIMEOUT, 10)

    const [isProcessing, setProcessing] = useState(false)
    const [headline, setHeadline] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [addresses, setAddresses] = useState([])

    const handleSend = async (event) => {
        event.preventDefault()

        const sendMail = async (event, addressesString) => {

            const encodedMail = btoa("Content-Type: text/html; charset=\"UTF-8\"\nMIME-Version: 1.0\nContent-Transfer-Encoding: 7bit\n" +
                `Subject: ${subject}\nFrom: ${headline}\nBcc: ${addressesString}\n\n${message}`
            ).replace(/\+/g, '-').replace(/\//g, '_');
            await Axios.post(`https://www.googleapis.com/gmail/v1/users/me/messages/send?access_token=${props.token.access_token}`,
                {raw: encodedMail}).then((response) => {
                console.log(response.data)
            }).catch(err => {
                console.error(err)
                event.reset()
                alert("Oops, something went wrong. Check out console output")
            })
        }

        setProcessing(true)
        const batches = []
        for (let i = 0, len = addresses.length; i < len; i += batchSize)
            batches.push(addresses.slice(i, i + batchSize));
        for (const value of batches) {
            const index = batches.indexOf(value);
            await sendMail(event, value.toString());
            if (index < batches.length - 1)
                await new Promise(r => setTimeout(r, timeout));
        }
        event.reset()
        setProcessing(false)
        setAddresses([])
        console.log(`Process ended ${new Date().toLocaleString()}`)
    }

    const handleFileSubmit = (event) => {
        const fileFromEvent = event.target.files[0]
        Papa.parse(fileFromEvent, {
            complete: function (results) {
                setAddresses(results.data.map(item => item[0]))
            }
        })
    }

    return (
        <div id={"email-form-wrapper"}>
            <Modal id={"spinner-modal"} show={isProcessing} backdrop="static" animation centered>
                <Spinner id={"spinner"} animation="border" role="status" variant={"light"}>
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Modal>
            <form id={"email-form"}>
                <label htmlFor="file">Choose csv file containing email addresses</label>
                <input id={"file"} type="file" accept={".csv"} disabled={isProcessing}
                       onChange={event => handleFileSubmit(event)}
                       placeholder={"Choose csv file containing email addresses"}/>
                <input id="headline" type="text" placeholder="Headline" disabled={isProcessing} value={headline}
                       onChange={event => setHeadline(event.target.value)}/>
                <input id="subject" type="text" placeholder="Subject" disabled={isProcessing} value={subject}
                       onChange={event => setSubject(event.target.value)}/>
                <textarea id="message" rows="7" placeholder="Message" disabled={isProcessing} value={message}
                          onChange={event => setMessage(event.target.value)}/>
                <div id={"btn-wrapper"}>
                    <button id="reset-btn" onClick={event => event.reset()}>Reset</button>
                    <button id="execute-btn" type={"submit"}
                            disabled={props.token.access_token === undefined || addresses.length === 0 || isProcessing}
                            onSubmit={handleSend}>
                        {isProcessing ? "Sending..." : "Send"}
                    </button>
                </div>
            </form>
        </div>
    )
}