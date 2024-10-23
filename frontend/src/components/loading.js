import "./loading.css";

const Loading = () => {
    return (
        <img src={process.env.PUBLIC_URL + "/ezsea_logo.svg"} alt="Logo" style={{ width: "15%", marginBottom: "1em" }}></img>
    )
}

export default Loading;
