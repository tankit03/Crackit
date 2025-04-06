import { supabase } from './supabase';

export interface PublishTestData {
  name: string;
  university: string;
  className: string;
  tags: string[];
  description?: string;
  questions: any[];
}

export async function publishTest(data: PublishTestData, userId: string) {
  try {
    // Validate input data
    if (!data.university || data.university.trim() === '') {
      throw new Error('University name is required');
    }

    if (!data.className || data.className.trim() === '') {
      throw new Error('Class name is required');
    }

    if (!data.name || data.name.trim() === '') {
      throw new Error('Test name is required');
    }

    if (!data.questions || data.questions.length === 0) {
      throw new Error('Test must contain at least one question');
    }

    // First, try to find or create the university
    const { data: universityData, error: universityError } = await supabase
      .from('universities')
      .select('id')
      .eq('name', data.university.trim())
      .single();

    if (universityError && universityError.code !== 'PGRST116') {
      console.error('University search error:', universityError);
      throw new Error(`Error finding university: ${universityError.message}`);
    }

    let university_id = universityData?.id;

    if (!university_id) {
      const { data: newUniversity, error: createUniversityError } =
        await supabase
          .from('universities')
          .insert([{ name: data.university.trim() }])
          .select('id')
          .single();

      if (createUniversityError) {
        console.error('University creation error:', createUniversityError);
        throw new Error(`Error creating university: ${createUniversityError.message}`);
      }

      if (!newUniversity?.id) {
        throw new Error('Failed to create university: No ID returned');
      }

      university_id = newUniversity.id;
    }

    // Then, try to find or create the class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('name', data.className)
      .eq('university_id', university_id)
      .single();

    if (classError && classError.code !== 'PGRST116') {
      throw new Error('Error finding class');
    }

    let class_id = classData?.id;

    if (!class_id) {
      const { data: newClass, error: createClassError } = await supabase
        .from('classes')
        .insert([
          {
            name: data.className,
            university_id: university_id,
          },
        ])
        .select('id')
        .single();

      if (createClassError) {
        throw new Error('Error creating class');
      }

      class_id = newClass.id;
    }

    // Finally, insert the test
    const { error: insertError } = await supabase.from('test').insert([
      {
        name: data.name,
        questions: data.questions,
        user_id: userId,
        university_id: university_id,
        class_id: class_id,
        tags: data.tags.join(','),
        description: data.description,
      },
    ]);

    if (insertError) {
      throw new Error(insertError.message);
    }
  } catch (error) {
    console.error('Error publishing test:', error);
    throw error;
  }
}
