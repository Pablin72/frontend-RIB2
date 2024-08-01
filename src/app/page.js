'use client';
import { useState } from 'react';
import Styles from './styles.module.css';
import Modal from './modal';

import {
  getDocumentByName,
  lemmatized_bow_cosine,
  stemmed_bow_cosine,
  lemmatized_tfidf_cosine,
  stemmed_tfidf_cosine,
  stemmed_bow_jaccard,
  lemmatized_bow_jaccard,
  stemmed_tfidf_jaccard,
  lemmatized_tfidf_jaccard
} from '../repos/inforRetrieval';

function getPaginationRange(currentPage, totalPages, siblingCount = 1) {
  const totalPageNumbers = siblingCount + 5;

  if (totalPages <= totalPageNumbers) {
    return [...Array(totalPages).keys()].map(n => n + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = [...Array(leftItemCount).keys()].map(n => n + 1);
    return [...leftRange, '...', totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = [...Array(rightItemCount).keys()].map(n => totalPages - rightItemCount + n + 1);
    return [firstPageIndex, '...', ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = [...Array(rightSiblingIndex - leftSiblingIndex + 1).keys()].map(n => leftSiblingIndex + n);
    return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
  }
}

export default function Home() {
  const [threshold, setThreshold] = useState(0.1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    imageInput: '',
    preprocess: '',
    representation: '',
    comparison: '',
  });
  const [result, setResult] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 7;
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const openModal = async (filename) => {
    const data = await getDocumentByName(filename);
    setModalContent(data.content);
    setModalOpen(true);
  };

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = result.slice(indexOfFirstResult, indexOfLastResult);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevFormData => {
      let updatedFormData = { ...prevFormData, [name]: value };

      if (name === 'representation') {
        if (value === 'bow') {
          updatedFormData.comparison = 'jaccard';
        } else if (value === 'tf_idf') {
          updatedFormData.comparison = 'cosine';
        }
      }

      console.log("options: ", updatedFormData);
      return updatedFormData;
    });
  };

  const handleSetResult = (myResults) => {
    const filteredResults = myResults.filter(item =>
      (item.Jaccard_Similarity && item.Jaccard_Similarity > threshold) ||
      (item.Cosine_Similarity && item.Cosine_Similarity > threshold)
    );
    setResult(filteredResults);
  };

  const handleSetThreshold = (e) => {
    setThreshold(e.target.value);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.preprocess === '' && formData.representation === '' && formData.comparison === '') {
      alert("Please select all options");
      return;
    };

    setLoading(true);

    try {
      if (formData.preprocess === 'lemmatized' && formData.representation === 'tf_idf' && formData.comparison === 'cosine') {
        handleSetResult(await lemmatized_tfidf_cosine(formData.imageInput));
      };

      if (formData.preprocess === 'stemmized' && formData.representation === 'tf_idf' && formData.comparison === 'cosine') {
        handleSetResult(await stemmed_tfidf_cosine(formData.imageInput));
      };

      if (formData.preprocess === 'stemmized' && formData.representation === 'bow' && formData.comparison === 'jaccard') {
        handleSetResult(await stemmed_bow_jaccard(formData.imageInput));
      };

      if (formData.preprocess === 'lemmatized' && formData.representation === 'bow' && formData.comparison === 'jaccard') {
        handleSetResult(await lemmatized_bow_jaccard(formData.imageInput));
      };
    } catch (e) {
      console.log("Error fetching results: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      imageInput: e.target.files[0]
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFormData({
      ...formData,
      imageInput: e.dataTransfer.files[0]
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const totalPages = Math.ceil(result.length / resultsPerPage);
  const paginationRange = getPaginationRange(currentPage, totalPages);

  return (
    <div>
      <div>
        <form className={Styles.form} onSubmit={handleSubmit}>
          <div
            className={Styles.dragDrop}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <label htmlFor="imageInput" className={Styles.label}>Drag & Drop or Click to Upload Image</label>
            <input type="file" id="imageInput" name="imageInput" className={Styles.input_file} onChange={handleImageChange} accept="image/*"></input>
          </div>
          <div className={Styles.form_group}>
            <button type="submit" className={Styles.submit_button} disabled={loading}>Search</button>
          </div>
        </form>
      </div>
      <div className={Styles.tableContainer}>
        <h2>Results:</h2>
        {loading ? (
          <div className={Styles.loading}>Loading...</div>
        ) : (
          <div>
            <table className={Styles.table}>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Similarity</th>
                </tr>
              </thead>
              <tbody>
                {currentResults.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <button onClick={() => openModal(item.Filename)} className={Styles.linkButton}>
                        {item.Filename}
                      </button>
                    </td>
                    <td>{item.Cosine_Similarity || item.Jaccard_Similarity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className={Styles.pagination}>
          {paginationRange.map((page, index) => {
            if (page === '...') {
              return <span key={`dots-${index}`} className={Styles.dots}>...</span>;
            }
            return (
              <button
                key={`page-${page}`}
                onClick={() => paginate(page)}
                className={page === currentPage ? Styles.active : ''}
              >
                {page}
              </button>
            );
          })}
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} content={modalContent} />
    </div>
  );
}
