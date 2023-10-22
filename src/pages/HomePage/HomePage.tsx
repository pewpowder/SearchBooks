import { Link, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import SearchPanel from 'components/SearchPanel/SearchPanel';
import ThemeToggle from 'components/ThemeToggle/ThemeToggle';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'hooks/redux-hooks';
import { fetchBooks, resetBooks } from 'features/books/booksSlice';
import useSearchParamsAndNavigate from 'hooks/useSearchParamsAndNavigate';
import useScrollY from 'hooks/useScrollY';
import type { FetchBooksParams } from 'types';
import { selectBooksStatus } from 'features/books/booksSelectors';
import { BOOKS_COUNT_REQUESTED_DEFAULT } from 'services/services';

import styles from './HomePage.module.scss';

type ContextType = {
  scrolledY: number;
  handleScroll: () => void;
};

function HomePage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectBooksStatus); // TODO: Remove status from the page. This adds to additional renders.

  const [query, setQuery] = useState('Clean code');
  const startIndexRef = useRef(0);
  const booksCountRef = useRef(BOOKS_COUNT_REQUESTED_DEFAULT);
  const navigate = useNavigate();

  const [scrolledY, setScrolledY] = useScrollY(); // [scrolledY, setScrolledY] defined inside HomePage so that users see same client view when they returning from BookDetails component.
  const [searchParams, updateSearchParamsAndNavigate] =
    useSearchParamsAndNavigate('/books');

  const requestBooks = (fetchParams: FetchBooksParams) => {
    updateSearchParamsAndNavigate(fetchParams);
    dispatch(fetchBooks(fetchParams));
  };

  const handleOnSearch = () => {
    resetPreviousBooks();
    requestBooks({
      query,
      startIndex: startIndexRef.current,
      booksCount: booksCountRef.current,
    });
  };

  const handleScroll = () => {
    const offsetHeight = document.body.offsetHeight;
    const screenHeight = window.innerHeight;

    const scrolledTop = window.scrollY + screenHeight;
    const threshold = offsetHeight - screenHeight / 3;

    if (status !== 'pending' && scrolledTop >= threshold) {
      startIndexRef.current += BOOKS_COUNT_REQUESTED_DEFAULT;
      booksCountRef.current += BOOKS_COUNT_REQUESTED_DEFAULT;
      setScrolledY(threshold - screenHeight);

      requestBooks({
        query,
        startIndex: startIndexRef.current,
        booksCount: booksCountRef.current,
      });
    }
  };

  // const req = () => {
  //   return requestBooks({
  //     query,
  //     startIndex: startIndexRef.current,
  //     booksCount: booksCountRef.current,
  //   })
  // }

  const resetPreviousBooks = () => {
    startIndexRef.current = 0;
    booksCountRef.current = BOOKS_COUNT_REQUESTED_DEFAULT;
    setScrolledY(0);
    dispatch(resetBooks());
  };

  const outletContext = useMemo(() => {
    return {
      scrolledY,
      handleScroll,
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrolledY, status]);

  useEffect(() => {
    if (searchParams.has('query')) {
      const searchParamsQuery = searchParams.get('query') as string;
      const searchParamsBooksCount = Number(searchParams.get('booksCount'));
      booksCountRef.current =
        searchParamsBooksCount ?? BOOKS_COUNT_REQUESTED_DEFAULT;
      setQuery(searchParamsQuery);

      const fetchParams: FetchBooksParams = {
        query: searchParamsQuery,
        startIndex: startIndexRef.current,
        booksCount: booksCountRef.current,
      };

      const controller = new AbortController();
      const signal = controller.signal;
      dispatch(fetchBooks({ ...fetchParams, signal }));
      updateSearchParamsAndNavigate(fetchParams);

      return () => {
        controller.abort();
        navigate(-1); // TODO: Check if it can produce bugs
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles['container']}>
      <header className={styles['header']}>
        <Link
          to="/"
          className={styles['home-link']}
          onClick={resetPreviousBooks}
        >
          JUTSU
        </Link>
        <ThemeToggle />
      </header>
      <main>
        <SearchPanel
          query={query}
          setQuery={setQuery}
          handleOnSearch={handleOnSearch}
        />
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}

export const useTypedOutletContext = () => useOutletContext<ContextType>();

export default HomePage;
