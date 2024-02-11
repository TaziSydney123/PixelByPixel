import { useEffect, useState } from "react";

import { Popover } from "antd";

import styles from "./Canvas.module.css";

type CanvasProps = {
    imageData: string[][],
    onChangedPixel: (pixel: ChangedPixel) => void;
};

export interface ChangedPixel {
    x: number;
    y: number;
    newColor: string;
}

const PALETTE = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
    '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6',
    '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
];

export default function Canvas(props: CanvasProps) {
    const { imageData } = props;
    const height = imageData.length;
    const width = imageData[0].length;

    const [openId, setOpenId] = useState<number | null>(null);

    const [changedId, setChangedId] = useState<number | null>(null);
    const [newColor, setNewColor] = useState<string>('#');

    document.addEventListener('click', () => {
        setOpenId(null);
    });

    useEffect(() => {
        function adjustPixelSize() {
            const maxWidth = window.innerWidth * 0.9;
            const maxHeight = window.innerHeight * 0.9;
            const maxPixelWidth = maxWidth / width;
            const maxPixelHeight = maxHeight / height;
            const pixelSize = Math.min(maxPixelWidth, maxPixelHeight);
            document.documentElement.style.setProperty('--pixel-size', `${pixelSize}px`);
        }
    
        window.addEventListener('resize', adjustPixelSize);
        adjustPixelSize();
    
        return () => window.removeEventListener('resize', adjustPixelSize);
    }, [height, width]);

    return (
        <div className={styles.grid}>
            {[...Array(height)].map((_, y) => (
                <div key={y} className={styles.row}>
                    {[...Array(width)].map((_, x) => (
                        <Popover
                            key={x}
                            open={openId === y * width + x}
                            content={
                                <div className={styles.colorSelectGrid}>
                                    {PALETTE.map((color) => <div key={color} style={{ "background": color }} className={styles.colorSelectGridColor} onClick={() => {
                                        setChangedId(y * width + x);
                                        setNewColor(color);
                                        setOpenId(null);
                                        props.onChangedPixel({ x: x, y: y, newColor: color });
                                    }}></div>)}
                                </div>
                            }>
                            <div className={styles.pixel} style={{ "background": y * width + x === changedId ? newColor : imageData[x][y] }} onClick={e => {
                                setOpenId(y * width + x);
                                e.stopPropagation();
                            }} />
                        </Popover>
                    ))}
                </div>
            ))}
        </div>
    );
}