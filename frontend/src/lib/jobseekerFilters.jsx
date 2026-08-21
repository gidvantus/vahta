import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchFilters } from '../api.js';
import { SALARY_MIN } from './query.js';

const JobSeekerFiltersContext = createContext(null);

const EMPTY_OPTIONS = { cities: [], schedules: [], salary: [] };

/* Состояние фильтров кабинета вахтовика: общее для страниц кабинета. */
export function JobSeekerFiltersProvider({ children }) {
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [cities, setCities] = useState(() => new Set());
  const [salary, setSalary] = useState('any');
  const [schedule, setSchedule] = useState('any');

  useEffect(() => {
    fetchFilters()
      .then(setOptions)
      .catch(() => setOptions(EMPTY_OPTIONS));
  }, []);

  const state = useMemo(
    () => ({ query: '', cities, salary, schedule, sort: 'date' }),
    [cities, salary, schedule],
  );

  const toggleCity = useCallback((city, checked) => {
    setCities((prev) => {
      const next = new Set(prev);
      if (checked) next.add(city);
      else next.delete(city);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setCities(new Set());
    setSalary('any');
    setSchedule('any');
  }, []);

  const value = useMemo(
    () => ({ options, state, toggleCity, setSalary, setSchedule, reset }),
    [options, state, toggleCity, reset],
  );

  return (
    <JobSeekerFiltersContext.Provider value={value}>
      {children}
    </JobSeekerFiltersContext.Provider>
  );
}

export function useJobSeekerFilters() {
  return useContext(JobSeekerFiltersContext);
}

export function vacancyMatchesFilters(vacancy, state) {
  if (!state) return true;
  if (state.cities?.size && !state.cities.has(vacancy.city)) return false;
  if (state.schedule && state.schedule !== 'any') {
    const value = vacancy.schedule || '';
    if (state.schedule === 'other') {
      if (value) return false;
    } else if (value !== state.schedule) {
      return false;
    }
  }
  if (state.salary === 'specified') {
    if (vacancy.salary_from == null) return false;
  } else if (state.salary && state.salary !== 'any') {
    const min = SALARY_MIN[state.salary];
    if (vacancy.salary_from == null || vacancy.salary_from < min) return false;
  }
  return true;
}

export function hasActiveFilters(state) {
  if (!state) return false;
  return (state.cities && state.cities.size > 0)
    || (state.salary && state.salary !== 'any')
    || (state.schedule && state.schedule !== 'any');
}
