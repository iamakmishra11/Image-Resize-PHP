<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Debugging logs
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Files: " . print_r($_FILES, true));
error_log("Post Data: " . print_r($_POST, true));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
    exit();
}

// Ensure files are uploaded
if (!isset($_FILES['images']) || count($_FILES['images']['tmp_name']) === 0) {
    echo json_encode(["status" => "error", "message" => "No images received"]);
    exit();
}

// Validate width and height
$width = isset($_POST["width"]) ? intval($_POST["width"]) : 600;
$height = isset($_POST["height"]) ? intval($_POST["height"]) : 800;

if (!$width || !$height || $width <= 0 || $height <= 0) {
    echo json_encode(["status" => "error", "message" => "Invalid width or height"]);
    exit();
}

// Create directories if they don’t exist
$uploadDir = __DIR__ . "/uploads/";
$resizedDir = __DIR__ . "/uploads/resized/";

if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true)) {
    echo json_encode(["status" => "error", "message" => "Failed to create upload directory"]);
    exit();
}

if (!is_dir($resizedDir) && !mkdir($resizedDir, 0777, true)) {
    echo json_encode(["status" => "error", "message" => "Failed to create resized images directory"]);
    exit();
}

$results = [];

// Process each uploaded image
foreach ($_FILES['images']['tmp_name'] as $index => $tmpName) {
    $originalName = $_FILES['images']['name'][$index];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $newName = pathinfo($originalName, PATHINFO_FILENAME) . "_resized." . $extension;
    $uploadPath = $uploadDir . $originalName;
    $resizedPath = $resizedDir . $newName;

    if (!move_uploaded_file($tmpName, $uploadPath)) {
        echo json_encode(["status" => "error", "message" => "Failed to move uploaded file"]);
        exit();
    }

    list($origWidth, $origHeight) = getimagesize($uploadPath);
    $image = null;

    switch ($extension) {
        case 'jpg':
        case 'jpeg':
            $image = imagecreatefromjpeg($uploadPath);
            break;
        case 'png':
            $image = imagecreatefrompng($uploadPath);
            break;
        case 'gif':
            $image = imagecreatefromgif($uploadPath);
            break;
        default:
            continue 2; // Skip unsupported file types
    }

    $resizedImage = imagecreatetruecolor($width, $height);
    imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $width, $height, $origWidth, $origHeight);

    switch ($extension) {
        case 'jpg':
        case 'jpeg':
            imagejpeg($resizedImage, $resizedPath);
            break;
        case 'png':
            imagepng($resizedImage, $resizedPath);
            break;
        case 'gif':
            imagegif($resizedImage, $resizedPath);
            break;
    }

    imagedestroy($image);
    imagedestroy($resizedImage);

    $results[] = [
        "originalName" => $originalName,
        "resizedName" => $newName,
        "path" => "uploads/resized/" . $newName
    ];
}

if (!empty($results)) {
    echo json_encode(["status" => "success", "results" => $results]);
} else {
    echo json_encode(["status" => "error", "message" => "Image processing failed"]);
}
?>