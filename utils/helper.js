
exports.bytesToMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
}

exports.formattedDate = (date) => {
    var year = date.toLocaleString("default", { year: "numeric" });
    var month = date.toLocaleString("default", { month: "2-digit" });
    var day = date.toLocaleString("default", { day: "2-digit" });
    var hour = date.toLocaleString("default", { hour: "2-digit", hour12: false });
    var minute = date.toLocaleString("default", { minute: "2-digit" });

    return `${year}-${month}-${day} ${hour}:${minute}`;
}