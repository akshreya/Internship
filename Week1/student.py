students = []

while True:
    print("Student Management Sys")
    print("1. Add Student")
    print("2. Update Student")
    print("3. Delete Student")
    print("4. Display Students")
    print("5. Exit")

    choice = input("Enter choice: ")

    if choice == "1":
        sid = int(input("Enter ID: "))
        name = input("Enter Name: ")
        age = int(input("Enter Age: "))
        dept = input("Enter Department: ")

        student = {
            "id": sid,
            "name": name,
            "age": age,
            "department": dept
        }

        students.append(student)
        print("Student added")

    elif choice == "2":
        sid = int(input("Enter ID to update: "))

        found = False

        for student in students:
            if student["id"] == sid:
                student["name"] = input("Enter new name: ")
                student["age"] = int(input("Enter new age: "))
                student["department"] = input("Enter new department: ")
                found = True
                print("Student updated!")
                break

        if not found:
            print("Student not found!")

    elif choice == "3":
        sid = int(input("Enter ID to delete: "))

        found = False

        for student in students:
            if student["id"] == sid:
                students.remove(student)
                found = True
                print("Student deleted")
                break

        if not found:
            print("Student not found")

    elif choice == "4":
        if len(students) == 0:
            print("No students available.")
        else:
            print("\nStudent Records:")
            for student in students:
                print(student)

    elif choice == "5":
        break

    else:
        print("Invalid choice!")
