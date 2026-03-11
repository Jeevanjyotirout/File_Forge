import React, { useState } from "react";
import axios from "axios";

function UploadBox() {
    const [files, setFiles] = useState([]);

    const handleUpload = async () => {
        const formData = new FormData();

        files.forEach((file) => {
            formData.append("files", file);
        });

        try {
            const res = await axios.post(
                "http://localhost:8000/upload",
                formData
            );

            console.log(res.data);
            alert("Upload successful");
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow">
            <input
                type="file"
                multiple
                onChange={(e) => setFiles([...e.target.files])}
            />

            <button
                onClick={handleUpload}
                className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
            >
                Upload
            </button>
        </div>
    );
}

export default UploadBox;