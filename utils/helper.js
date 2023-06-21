
exports.bytesToMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
}

exports.formattedDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
    return date.toLocaleString('en-US', options).replace(/[/]/g, '-').replace(/[,]/g, '');
}