export const exams = [
  { course: 'CVEN3101', date: '2026-11-27', start: '13:45', end: '16:00', room: 'Ainsworth G01', weight: '35%' },
  { course: 'CVEN3202', date: '2026-12-01', start: '09:45', end: '12:00', room: 'Law Building 388', weight: '60%' },
  { course: 'ENGG2500', date: '2026-12-05', start: '13:45', end: '16:00', room: 'Rupert Myers 1001', weight: '55%' },
];

const operations = 'CVEN3101';
const soils = 'CVEN3202';
const fluids = 'ENGG2500';

function session(minutes, course, title, detail, checklistWeeks) {
  return { minutes, course, title, detail, checklistWeeks, kind: 'study' };
}

function fixedSession(start, end, course, title, detail, kind) {
  return { start, end, course, title, detail, kind };
}

function day(date, title, free, ...sessions) {
  return { date: '2026-' + date, title, free, sessions };
}

function exam(course, detail) {
  const { start, end, room } = exams.find(item => item.course === course);
  return fixedSession(start, end, course, 'Final exam', room + '. ' + detail, 'exam');
}

export const studyWeeks = [
  {
    title: 'Set up and get ahead',
    summary: 'Start with your next checklist topics, make progress on Part B and prepare for the first deadlines.',
    days: [
      day('11-11', 'Set up for study', 'Optional setup. Swap this with a block on another day if you already have plans.',
        session(45, '', 'Gather what you need', 'Save the Part B rubric, exam scope, past papers and solutions. Choose two unseen papers per course for mocks.')),
      day('11-12', 'Start from the checklist', 'Evening free.',
        session(120, operations, 'Part B outline and evidence', 'Map the marking criteria to your Penrith Stadium report sections. Build a list of evidence and calculations still needed.'),
        session(90, soils, 'Week 1 · Soil phase relationships and classification', 'Draw the phase diagram and learn the main quantities. Work two guided examples, then try three short questions on your own. Finish with one soil classification question.', [1]),
        session(45, fluids, 'Week 2 · Submerged forces', 'Sketch a pressure diagram and solve for resultant force and centre of pressure. Do a short check on buoyancy and floating stability, then set up one accelerating-fluid problem.', [2])),
      day('11-13', 'Draft and clear the first deadline', 'Evening free.',
        session(120, operations, 'Draft Part B', 'Write the highest-weight sections first. Add tables, calculations and project evidence while drafting.'),
        session(75, fluids, 'Online Assignment 4', 'Work through pipe friction and minor losses. Check units, signs and calculator inputs before submitting.'),
        session(60, soils, 'Week 1 retest and Week 2 compaction', 'Redo two Week 1 setups without notes. Review clay mineralogy and do one compaction example. If Week 1 takes longer, return later to finish the Week 2 work before ticking this block.', [1, 2])),
      day('11-14', 'Light Saturday', 'Afternoon and evening free.',
        session(75, fluids, 'Assignment 4 submission check', 'Confirm the submission by the 11:55 pm deadline. Use any spare time to redo your hardest question.'),
        session(90, soils, 'Guided Quiz 3 prep · Weeks 5–8', 'The quiz is on 16 Nov. Learn the basic setup from worked examples on consolidation and shear strength. Then try one similar question of each type with notes available.')),
      day('11-15', 'Close Lab 2 and prepare for Quiz 3', 'Evening free.',
        session(45, soils, 'Lab 2 activity sheet', 'Check figures, units and file upload. Submit before 11:55 pm.'),
        session(90, soils, 'Quiz 3 practice · Weeks 5–8', 'Review the worked examples on consolidation, shear strength and direct shear, then do a short practice set. Mark it immediately and redo the setup on missed questions.'),
        session(105, operations, 'Part B draft', 'Complete another substantive section and identify gaps before the review pass.')),
    ],
  },
  {
    title: 'Finish the submissions',
    summary: 'Get the Soil Mechanics quiz and lab module out of the way, then submit Part B and the Pipe Flow report.',
    days: [
      day('11-16', 'Quiz 3 and Part B', 'Evening free.',
        session(120, operations, 'Part B draft', 'Complete remaining major sections. Check each claim has evidence or a stated assumption.'),
        fixedSession('13:00', '13:30', soils, 'Quiz 3', 'Weeks 5–8. Open Moodle early and check the quiz instructions.', 'assessment'),
        session(60, soils, 'Lab 3 report module', 'Start the online module. Check Moodle for the 17 November cutoff time.'),
        session(45, fluids, 'Pipe Flow report setup', 'Organise lab data, units and the plots you need.')),
      day('11-17', 'Submit the lab module', 'Evening free.',
        session(60, soils, 'Finish Lab 3 report module', 'Complete it early and confirm submission. The calendar lists the closing date without a time.'),
        session(120, operations, 'Part B evidence and calculations', 'Check tables, assumptions, references and calculations against the rubric.'),
        session(75, fluids, 'Pipe Flow report calculations', 'Calculate friction factors and head losses. Compare measured and expected trends.')),
      day('11-18', 'Review the reports and start exam practice', 'Evening free.',
        session(120, operations, 'Part B rubric review', 'Read the draft against each marking criterion. Fix the highest-impact omissions.'),
        session(90, fluids, 'Draft the Pipe Flow discussion', 'Explain trends, measurement uncertainty and deviations using your actual results.'),
        session(60, operations, 'Week 5 · Contract management', 'Start the first unchecked CVEN3101 topic. Review key contract roles and obligations, then answer two short scenarios and justify your decisions.', [5])),
      day('11-19', 'Prepare Part B for submission', 'Evening free.',
        session(120, operations, 'Part B final PDF and Turnitin', 'Check formatting, references and rubric coverage. Run the separate similarity check, then submit through the marking link if ready.'),
        session(105, fluids, 'Pipe Flow report draft', 'Complete the figures, discussion and conclusion. Check that every claim matches the data.'),
        session(60, soils, 'Week 3 · Stress and Mohr circle', 'Work one example on vertical and effective stress, then draw a Mohr circle from given stresses. Try one fresh setup independently.', [3])),
      day('11-20', 'Part B due at noon', 'Evening free.',
        session(30, operations, 'Confirm Part B submission', 'Verify the final PDF and receipt before noon on 20 Nov. Use this as a submission buffer if you have already uploaded it.'),
        session(105, fluids, 'Pipe Flow report final review', 'Check plots, friction factor calculations and discussion against the rubric. Submit early if ready.'),
        session(90, operations, 'Weeks 7–8 · Cost estimation', 'Do one conceptual and one detailed estimating question. Check quantities, rates and units before comparing with the solution.', [7, 8])),
      day('11-21', 'Light Saturday', 'Afternoon and evening free.',
        session(75, fluids, 'Pipe Flow report submission check', 'Confirm the report is uploaded before 11:55 pm. Use spare time for one pipe-loss problem.'),
        session(90, operations, 'Weeks 9–10 · Safety, quality, ethics and risk', 'Review QA versus QC and practise two scenario answers. State a decision, justify it and describe how you would manage the risk.', [9, 10])),
      day('11-22', 'Full day off', 'Keep the whole day free. If plans change, swap this rest day with another flexible day.'),
    ],
  },
  {
    title: 'CVEN3101 exam week',
    summary: 'Complete two timed CVEN3101 mocks, then shift to Soil Mechanics. Finish Fluid Mechanics Assignment 5 early.',
    days: [
      day('11-23', 'CVEN3101 mock 1', 'Evening free.',
        session(135, operations, 'Timed mock 1', 'Use an unseen paper or matched set from Weeks 5–10. Use the permitted materials and match the exam window.'),
        session(75, operations, 'Mark and diagnose', 'Use the marking guide. Classify lost marks as knowledge, method, reading, time or arithmetic.'),
        session(60, soils, 'Week 4 · Stress in soils and one-dimensional seepage', 'Revisit effective stress in a layered soil. Use a worked example for head loss and hydraulic gradient, then solve a similar question.', [4])),
      day('11-24', 'Repair the gaps', 'Evening free.',
        session(105, operations, 'Repair mock 1 errors', 'Redo the weakest questions from a blank page. Add a fresh question on each weak method.'),
        session(90, soils, 'Weeks 5 and 7 · Seepage and consolidation', 'Sketch one flow net and work a settlement calculation. Follow with a time-rate problem, checking the drainage path and units.', [5, 7]),
        session(75, fluids, 'Online Assignment 5', 'Attempt the full set and flag questions for the follow-up block.')),
      day('11-25', 'CVEN3101 mock 2', 'Evening free.',
        session(135, operations, 'Timed mock 2', 'Use a different unseen paper. Check whether you can maintain accuracy under the same time limit.'),
        session(75, operations, 'Mark and fix repeat errors', 'Compare the score and error types with mock 1. Pick two corrections for the final CVEN3101 review.'),
        session(60, fluids, 'Finish Assignment 5', 'Check answers and submit ahead of the Saturday deadline.')),
      day('11-26', 'Taper before the CVEN3101 exam', 'Leave time to pack and get a full night of sleep.',
        session(90, operations, 'Final CVEN3101 review', 'Redo the two highest-cost errors. Recall the steps for cost estimation, contracts, safety, quality, ethics and risk.'),
        session(90, soils, 'Weeks 8–10 · Shear, triaxial and stability', 'Do a short Mohr–Coulomb and direct shear check, then set up one triaxial stress-path question and one slope stability question. State the assumptions and show the steps.', [7, 8, 9, 10]),
        session(45, soils, 'Lab 3 sheet and learning modules', 'Start the activity-sheet upload and work through the 2D seepage and consolidation modules.')),
      day('11-27', 'CVEN3101 final exam', 'Evening off after the exam.',
        session(45, operations, 'Light warm-up', 'Review the mistake list and one familiar problem. Check Inspera, allowed notes, calculator and travel.'),
        exam(operations, 'Inspera. Check the official timetable and permitted materials before leaving.')),
      day('11-28', 'Soil Mechanics mock 1', 'Late afternoon and evening free.',
        session(135, soils, 'Timed mock 1', 'Use an unseen comprehensive set. Cover stress, seepage, consolidation, shear strength and stability.'),
        session(75, soils, 'Mark and diagnose', 'Record lost marks and decide which two topics to repair before mock 2.'),
        session(30, fluids, 'Assignment 5 submission check', 'Verify submission before 11:55 pm. If already confirmed, take the time off.')),
      day('11-29', 'Clear Soil Mechanics deadlines early', 'Evening free.',
        session(75, soils, 'Lab 3 sheet and Modules 4–6', 'Finish the lab sheet and the 2D seepage, rate of consolidation and Mohr–Coulomb modules. Confirm all submissions in Moodle.'),
        session(90, soils, 'Fix mock 1 errors', 'Solve new questions on your two biggest gaps. Explain the assumptions and check units.'),
        session(75, fluids, 'Bernoulli and momentum', 'Do one energy and one control-volume momentum problem. Draw the diagram before calculating.')),
    ],
  },
  {
    title: 'Soil and Fluid Mechanics finals',
    summary: 'Finish Soil Mechanics preparation, then spend the last three study days on timed Fluid Mechanics practice.',
    days: [
      day('11-30', 'Soil Mechanics mock 2', 'Leave the evening clear before the morning exam.',
        session(135, soils, 'Timed mock 2', 'Use a different unseen paper or a matched set. Check that your pacing works with the permitted materials.'),
        session(75, soils, 'Mark and correct priority errors', 'Redo the mistakes most likely to cost marks. Make a one-page recall sheet.'),
        session(30, soils, 'Confirm Moodle submissions', 'Check the Lab 3 activity sheet and Modules 4–6. Exact cutoff times are unknown in the tracker.')),
      day('12-01', 'CVEN3202 final exam', 'Afternoon and evening off.',
        session(30, soils, 'Light warm-up', 'Review the recall sheet and check your calculator, permitted notes and travel.'),
        exam(soils, 'Check your official timetable and permitted materials.')),
      day('12-02', 'Fluid Mechanics mock 1', 'Evening free.',
        session(135, fluids, 'Timed mock 1', 'Use an unseen paper spanning all lecture topics. Use the permitted materials and match the exam window.'),
        session(75, fluids, 'Mark and diagnose', 'Tag marks lost to diagrams, pressure conventions, control-volume setup, friction assumptions or arithmetic.'),
        session(60, fluids, 'Redo the hardest questions', 'Rework the two biggest errors from a blank page and check your equations and units.')),
      day('12-03', 'Fluid Mechanics problem day', 'Evening free.',
        session(90, fluids, 'Hydrostatics, energy and momentum', 'Use one mixed set covering manometers, buoyancy, Bernoulli and control volumes. Prioritise weaknesses from mock 1.'),
        session(90, fluids, 'Pipe flow, similarity and drag', 'Practise Darcy–Weisbach, minor losses and Moody chart use. Add a similarity or boundary-layer question.'),
        session(60, fluids, 'Timed mixed set', 'Do three short questions without looking up examples. Mark and redo any setup errors.')),
      day('12-04', 'Fluid Mechanics mock 2', 'Leave time to pack and get a full night of sleep.',
        session(135, fluids, 'Timed mock 2', 'Use a different unseen paper under the same conditions. Check accuracy across the full course.'),
        session(60, fluids, 'Mark and repair', 'Check repeat errors and redo only the highest-value misses.'),
        session(45, fluids, 'Final formula and logistics check', 'Recall formula conditions, units and common sign conventions. Organise permitted materials and travel.')),
      day('12-05', 'ENGG2500 final exam', 'You are done after the exam.',
        session(45, fluids, 'Light warm-up', 'Do two familiar questions and review your mistake list. Check the room and arrival time.'),
        exam(fluids, 'Check your official timetable and permitted materials.')),
    ],
  },
];
