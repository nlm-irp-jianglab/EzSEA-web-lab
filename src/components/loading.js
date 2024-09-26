import "./loading.css";

const Loading = () => {
    return (
    <div id="loading_container">
        <svg id="loader" width="158" height="140" viewBox="0 0 158 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle id="circle1" cx="79" cy="18" r="17" stroke="#1355E4" stroke-width="2" transform="rotate(90, 79, 18)" />
            <circle id="circle2" cx="140" cy="122" r="17" stroke="#1355E4" stroke-width="2" transform="rotate(-155, 140, 122)" />
            <circle id="circle3" cx="18" cy="122" r="17" stroke="#1355E4" stroke-width="2" transform="rotate(-39, 18, 122)" />
            <line x1="31.4882" y1="112.141" x2="78.4882" y2="84.1409" stroke="#1355E4" stroke-width="2" />
            <line x1="125.538" y1="114.157" x2="78.538" y2="84.1571" stroke="#1355E4" stroke-width="2" />
            <line x1="79" y1="34" x2="79" y2="85" stroke="#1355E4" stroke-width="2" />
        </svg>
    </div>
    )
}

export default Loading;
