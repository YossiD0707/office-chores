import { useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { ChoreOccurrence } from '../../api/types';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

interface ChoreEvent extends Event {
  occurrence: ChoreOccurrence;
}

interface Props {
  occurrences: ChoreOccurrence[];
  memberColors: Record<number, string>;
  onSelectOccurrence: (occ: ChoreOccurrence) => void;
  onNavigate: (date: Date) => void;
}

export default function ChoreCalendar({ occurrences, memberColors, onSelectOccurrence, onNavigate }: Props) {
  const events: ChoreEvent[] = occurrences.map((occ) => ({
    title: occ.assigned_name ? `${occ.chore_title} — ${occ.assigned_name}` : `${occ.chore_title} (unassigned)`,
    start: new Date(occ.due_date + 'T00:00:00'),
    end: new Date(occ.due_date + 'T23:59:59'),
    allDay: true,
    occurrence: occ,
  }));

  const eventStyleGetter = useCallback((event: ChoreEvent) => {
    let color: string;
    if (event.occurrence.status === 'completed') {
      color = '#22c55e';
    } else if (event.occurrence.status === 'overdue') {
      color = '#ef4444';
    } else if (event.occurrence.assigned_to !== null) {
      color = memberColors[event.occurrence.assigned_to] ?? '#3b82f6';
    } else {
      color = '#9ca3af'; // gray for unassigned
    }
    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '0.75rem',
        padding: '1px 4px',
        cursor: 'pointer',
      },
    };
  }, [memberColors]);

  const handleSelectEvent = useCallback((event: ChoreEvent) => {
    onSelectOccurrence(event.occurrence);
  }, [onSelectOccurrence]);

  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="month"
        views={['month', 'week']}
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        onNavigate={onNavigate}
        popup
      />
    </div>
  );
}
