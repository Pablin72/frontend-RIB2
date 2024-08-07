'use client';
import { useState } from 'react';
import Styles from './styles.module.css';

const BASE_URL = 'http://127.0.0.1:5000/images/';

export default function Home() {
  const [imageInput, setImageInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageResults, setImageResults] = useState([]);
  const [queryImage, setQueryImage] = useState(null);

  const handleImageChange = (e) => {
    setImageInput(e.target.files[0]);
    setQueryImage(URL.createObjectURL(e.target.files[0]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageInput) {
      alert("Please upload an image.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', imageInput);

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log("Response data:", data);

      // Mostrar las imágenes similares
      const imageElements = data.map(([path, dist]) => {
        // Asegúrate de que `path` no tenga duplicaciones
        const cleanPath = path.replace('101_ObjectCategories/101_ObjectCategories', '101_ObjectCategories');
        return (
          <div key={cleanPath} className={Styles.result}>
            <img src={`${BASE_URL}${cleanPath}`} alt={`Similar ${cleanPath}`} className={Styles.resultImage} />
            <p>Distance: {dist}</p>
          </div>
        );
      });

      setImageResults(imageElements);
    } catch (error) {
      console.error("Error sending request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className={Styles.form} onSubmit={handleSubmit}>
        <div className={Styles.dragDrop}>
          <label htmlFor="imageInput" className={Styles.label}>Drag & Drop or Click to Upload Image</label>
          <input
            type="file"
            id="imageInput"
            name="imageInput"
            className={Styles.input_file}
            onChange={handleImageChange}
            accept="image/*"
          />
        </div>
        <div className={Styles.form_group}>
          <button type="submit" className={Styles.submit_button} disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </form>
      {queryImage && (
        <div className={Styles.queryImageContainer}>
          <h3>Query Image:</h3>
          <img src={queryImage} alt="Query" className={Styles.queryImage} />
        </div>
      )}
      <div className={Styles.resultsContainer}>
        {imageResults}
      </div>
    </div>
  );
}
