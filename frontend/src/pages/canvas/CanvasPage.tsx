import { useEffect, useState } from "react";

import { Flex, FloatButton, Spin, message } from "antd";
import { SendOutlined, HomeOutlined } from "@ant-design/icons";

import { Link, useNavigate, useParams } from "react-router-dom";

import Canvas, { ChangedPixel } from "../../components/Canvas";
import { apiPostRequest } from "../../network";
import styles from "./CanvasPage.module.css";

export default function CanvasPage() {
    const { username } = useParams();
    const [image, setImage] = useState<string[][] | null>(null);
    const [changedPixel, setChangedPixel] = useState<ChangedPixel>();
    const [sending, setSending] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [contactTurn, setContactTurn] = useState<boolean>(false);

    const navigate = useNavigate();

    useEffect(() => {
        apiPostRequest('getCanvas', {
            contact: username
        })
        .then((r: any) => {
            if (r.status === 200) {
                r.json().then((data: any) => {
                    setImage(data.image);
                    setContactTurn(data.turn === "WAITING_CONTACT");
                });
            } else {
                setImage(new Array(10).fill(new Array(10).fill("#ffffff")));
            }
        });
    }, []);

    function sendPixel() {
        if (changedPixel === undefined) {
            message.warning('Select a pixel to paint first');
            return;
        }

        setSending(true);

        apiPostRequest("pixel", {
            pixelX: changedPixel.x,
            pixelY: changedPixel.y,
            contact: username,
            color: changedPixel.newColor
        }).then(() => {
            message.info("Sent!");
            navigate('/home');
            setSending(false);
        }).catch(() => {
            message.error("Sorry, but we couldn't send your pixel");
            setSending(false);
        });
    }

    return (
        <>
            {contextHolder}
            <div className={styles.center}>
                <Link to="/home" className={styles.back}><HomeOutlined style={{ fontSize: 24 }} /></Link>

                {image === null ? (
                    <Spin />
                ) : (
                    <>
                        <Canvas imageData={image} onChangedPixel={(changedPixel: ChangedPixel) => setChangedPixel(changedPixel)} />
                        {!contactTurn && (
                            <Flex justify="center">
                                <FloatButton
                                    style={{ width: 70, height: 70, display: "flex", justifyContent: "center", alignItems: "center", padding: 10 }}
                                    icon={sending ? <Spin /> : <SendOutlined style={{ fontSize: 24 }} />}
                                    onClick={sendPixel}
                                />
                            </Flex>
                        )}
                    </>
                )}
            </div>
        </>
    );
}