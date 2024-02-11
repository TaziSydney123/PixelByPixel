import { useEffect, useState } from "react";

import { Flex, FloatButton, Spin, message } from "antd";
import { SendOutlined, HomeOutlined, ShareAltOutlined } from "@ant-design/icons";

import { Link, useNavigate, useParams } from "react-router-dom";

import Canvas, { ChangedPixel } from "../../components/Canvas";
import { apiPostRequest } from "../../network";
import styles from "./CanvasPage.module.css";

export default function CanvasPage() {
    const { username } = useParams();
    const [image, setImage] = useState<string[][] | null>(null);
    const [changedPixel, setChangedPixel] = useState<ChangedPixel>();
    const [sending, setSending] = useState<boolean>(false);
    const [_messageApi, contextHolder] = message.useMessage();
    const [contactTurn, setContactTurn] = useState<boolean>(false);

    const navigate = useNavigate();

    async function shareImage() {
        if (!image || image.length === 0 || image[0].length === 0) {
            console.error("Image data is empty or undefined.");
            return;
        }

        const pixelSize = 100;
        let c = document.createElement("canvas");
        c.width = pixelSize * image[0].length;
        c.height = pixelSize * image.length;

        let ctx = c.getContext("2d")!!;

        for (let x = 0; x < image.length; x++) {
            for (let y = 0; y < image[0].length; y++) {
                ctx.fillStyle = image[x][y];
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }

        // Use toBlob to create a blob from the canvas
        c.toBlob(async (blob) => {
            if (blob && navigator.share) {
                try {
                    await navigator.share({
                        files: [new File([blob], "canvas.png", { type: "image/png" })],
                        title: "Canvas",
                        text: "Check out my Canvas!"
                    });
                } catch (error) {
                    console.error("Error sharing the image", error);
                }
            } else {
                console.error("Blob is null or share not supported.");
            }
        }, 'image/png');
    }

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
                <FloatButton
                  style={{ width: 70, height: 70, display: "flex", justifyContent: "center", alignItems: "center", padding: 10 }}
                  icon={
                      <Flex>
                          {sending ? <Spin /> : <SendOutlined style={{ fontSize: 24 }} />}
                      </Flex>
                  }
                  onClick={sendPixel}
                />
            )}
            <FloatButton
              style={{ width: 70, height: 70, left: 15, display: "flex", justifyContent: "center", alignItems: "center", padding: 10 }}
              onClick={shareImage}
              icon={
                  <Flex justify="center">
                      <ShareAltOutlined style={{ fontSize: 24 }} />
                  </Flex>
              }
            />                                
          </>
        )}
      </div>
    </>  
  )
}