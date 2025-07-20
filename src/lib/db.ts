import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);

// Initialize database tables
export async function initDB() {
  try {
    console.log('Starting database initialization...');

    // Drop existing tables if needed (uncomment for fresh start)
    // await sql`DROP TABLE IF EXISTS attendance CASCADE`;
    // await sql`DROP TABLE IF EXISTS students CASCADE`;
    // await sql`DROP TABLE IF EXISTS teachers CASCADE`;

    // Create teachers table first (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Teachers table created/verified');

    // Create students table (depends on teachers)
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        grade VARCHAR(50) NOT NULL,
        address TEXT,
        contact VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Students table created/verified');

    // Add foreign key constraint for students table
    try {
      await sql`
        ALTER TABLE students 
        ADD CONSTRAINT fk_students_teacher 
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      `;
    } catch (fkError) {
      // Constraint might already exist
      console.log('Foreign key constraint for students may already exist');
    }

    // Create attendance table (depends on students and teachers)
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        date DATE NOT NULL,
        present BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Attendance table created/verified');

    // Add foreign key constraints for attendance table
    try {
      await sql`
        ALTER TABLE attendance 
        ADD CONSTRAINT fk_attendance_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      `;
    } catch (fkError) {
      console.log('Foreign key constraint for attendance-student may already exist');
    }

    try {
      await sql`
        ALTER TABLE attendance 
        ADD CONSTRAINT fk_attendance_teacher 
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      `;
    } catch (fkError) {
      console.log('Foreign key constraint for attendance-teacher may already exist');
    }

    // Add unique constraint for attendance
    try {
      await sql`
        ALTER TABLE attendance 
        ADD CONSTRAINT unique_student_date UNIQUE(student_id, date)
      `;
    } catch (constraintError) {
      console.log('Unique constraint for attendance may already exist');
    }

    // Create indexes after all tables and constraints are created
    console.log('Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email)',
      'CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade)',
      'CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id)'
    ];

    for (const indexQuery of indexes) {
      try {
        await sql.unsafe(indexQuery); // ✅ CORRECT

        console.log(`Created index: ${indexQuery.split(' ')[5]}`);
      } catch (indexError) {
        console.log(`Index creation error (may already exist): ${(indexError as any).message}`);

      }
    }

    console.log('Database initialization completed successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    const dbError = error as any;
console.error('Error details:', {
  message: dbError?.message ?? 'No message',
  code: dbError?.code ?? 'No code',
  detail: dbError?.detail ?? 'No detail',
  hint: dbError?.hint ?? 'No hint',
  routine: dbError?.routine ?? 'No routine'
});

    throw error;
  }
}

export { sql };