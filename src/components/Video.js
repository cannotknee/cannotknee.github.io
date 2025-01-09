import React from "react";
import abstract from "../assets/ink.mp4";

const Video = () => {
    return (
        <div className="background-video">
            <video src={abstract} autoPlay loop muted />
        </div>
    )
}

export default Video