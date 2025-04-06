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
    // First, try to find or create the university
    const { data: universityData, error: universityError } = await supabase
      .from('universities')
      .select('id')
      .eq('name', data.university)
      .single();

    if (universityError && universityError.code !== 'PGRST116') {
      throw new Error('Error finding university');
    }

    let university_id = universityData?.id;

    if (!university_id) {
      const { data: newUniversity, error: createUniversityError } =
        await supabase
          .from('universities')
          .insert([{ name: data.university }])
          .select('id')
          .single();

      if (createUniversityError) {
        throw new Error('Error creating university');
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
