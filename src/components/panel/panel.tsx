'use client'
import Image from "next/image";
import styles from "./page.module.css"


export type PanelPropsTypes = {
    props?: string | undefined;
    materialName: string | undefined;
    durationDetail: string | undefined;
}
const Panel = ({ props, materialName, durationDetail }: PanelPropsTypes) => {

    return (
        <div className={props}>
            <div className={styles.panelDetails}>
                {materialName}
                <Image 
                    src={`/dielsAlderRegiochemistry/textures/${materialName}_baseColor.png`} 
                    alt={materialName as string}
                    width={300}
                    height={100}    
                />
                <p>{durationDetail}</p>
            </div>
        </div >
    )
}

export default Panel;