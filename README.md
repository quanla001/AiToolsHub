# AiToolsHub

AiToolsHub is a comprehensive AI-powered platform integrating multiple AI tools into a single, unified application. It provides a wide range of AI services, including chatbot interactions, text-to-image generation, text-to-music composition, OCR (Optical Character Recognition), and text-to-speech conversion. This project is designed to offer developers and businesses a powerful toolkit for integrating AI capabilities into their workflows.

## Features

* **Text-to-Image**: Generate high-quality images from text prompts using models like Stable Diffusion.
* **Text-to-Music**: Create music from textual descriptions using ElevenLabs.
* **OCR (Optical Character Recognition)**: Extract text from images using GoogleVision.
* **Text-to-Speech**: Convert text to natural-sounding speech with ElevenLabs.
* **Chatbot**: Leverage advanced language models like Gemini-2.5-Flash for conversational AI.
* **User Management**: Secure user authentication and history management with Google Cloud Storage integration.

## Technologies Used

### Backend

* Spring Boot (Java)
* MySQL
* Minio for object storage
* RESTful APIs
* Docker for containerization

### Frontend

* React.js (with Tailwind CSS for styling)
* Gradio for interactive UI components

### AI Models

* Hugging Face API (Stable Diffusion)
* ElevenLabs( Music and TTS)
* GoogleVision (OCR)
* Gemini-2.5-Flash (Chatbot)

## Installation and Setup

1. Clone the repository:

```bash
git clone https://github.com/quanla001/AiToolsHub.git
```

2. Backend Setup:

* Navigate to the backend directory and build the Spring Boot application.
* Configure the `application.properties` or `application.yaml` with your database and API credentials.
* Run the application:

```bash
./mvnw spring-boot:run
```

3. Frontend Setup:

* Navigate to the frontend directory.
* Install dependencies and start the development server:

```bash
npm install
npm start
```

## Usage

* Access the platform through the provided web interface.
* Use API endpoints for integrating AI features into other applications.

## Contributing

* Fork the repository
* Create a new branch (`git checkout -b feature-branch`)
* Commit your changes (`git commit -m 'Add new feature'`)
* Push to the branch (`git push origin feature-branch`)
* Create a pull request

## License

This project is licensed under the MIT License.

## Contact

For any inquiries, please contact **Quàng Bình Quân** at **[quanjkl95@gmail.com](mailto:quanjkl95@gmail.com)**.
